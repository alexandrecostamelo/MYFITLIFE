import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectAndParse } from '@/lib/import/detect-format';
import { fuzzyMatch } from '@/lib/import/exercise-matcher';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const action = formData.get('action') as string;

  if (!file)
    return NextResponse.json({ error: 'no_file' }, { status: 400 });

  const content = await file.text();
  const { source, workouts } = detectAndParse(content, file.name);

  if (workouts.length === 0) {
    return NextResponse.json(
      { error: 'no_workouts_parsed', source },
      { status: 400 },
    );
  }

  // Preview mode — just return stats
  if (action === 'preview') {
    const totalSets = workouts.reduce(
      (s, w) => s + w.exercises.reduce((ss, e) => ss + e.sets.length, 0),
      0,
    );
    const uniqueExercises = new Set(
      workouts.flatMap((w) => w.exercises.map((e) => e.name)),
    ).size;
    return NextResponse.json({
      source,
      total_workouts: workouts.length,
      total_sets: totalSets,
      unique_exercises: uniqueExercises,
      date_range: {
        start: workouts[0].date,
        end: workouts[workouts.length - 1].date,
      },
      sample: workouts.slice(0, 3).map((w) => ({
        date: w.date,
        name: w.name,
        exercises: w.exercises.length,
        sets: w.exercises.reduce((s, e) => s + e.sets.length, 0),
      })),
    });
  }

  // Import mode
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name_pt, name_en')
    .limit(1000);

  // Build candidate list for fuzzy matching (both pt and en names)
  const candidates: { id: string; name: string }[] = [];
  for (const ex of (exercises || []) as Record<string, unknown>[]) {
    const id = String(ex.id);
    if (ex.name_en) candidates.push({ id, name: String(ex.name_en) });
    if (ex.name_pt) candidates.push({ id, name: String(ex.name_pt) });
  }

  const { data: importRecord } = await supabase
    .from('workout_imports')
    .insert({
      user_id: user.id,
      source,
      filename: file.name,
      status: 'processing',
      total_workouts: workouts.length,
      total_sets: workouts.reduce(
        (s, w) => s + w.exercises.reduce((ss, e) => ss + e.sets.length, 0),
        0,
      ),
      date_range_start: workouts[0].date,
      date_range_end: workouts[workouts.length - 1].date,
    } as Record<string, unknown>)
    .select()
    .single();

  let importedWorkouts = 0;
  let importedSets = 0;
  let skipped = 0;

  for (const workout of workouts) {
    // Deduplicate: skip if there's already a workout_log on the same day
    const dayStart = `${workout.date}T00:00:00Z`;
    const dayEnd = `${workout.date}T23:59:59Z`;
    const { data: existing } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd)
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const totalSets = workout.exercises.reduce(
      (s, e) => s + e.sets.length,
      0,
    );
    const durationSec =
      (workout.duration_minutes || Math.max(20, totalSets * 3)) * 60;
    const startedAt = `${workout.date}T12:00:00Z`;
    const finishedAt = new Date(
      new Date(startedAt).getTime() + durationSec * 1000,
    ).toISOString();

    const { data: log } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_sec: durationSec,
        notes: workout.notes
          ? `[${source}] ${workout.name} — ${workout.notes}`
          : `[${source}] ${workout.name}`,
      } as Record<string, unknown>)
      .select()
      .single();

    if (!log) continue;
    importedWorkouts++;

    const logId = String((log as Record<string, unknown>).id);

    for (const ex of workout.exercises) {
      const match = fuzzyMatch(ex.name, candidates);

      // Skip exercises we can't match (exercise_id is required in set_logs)
      if (!match) continue;

      for (const set of ex.sets) {
        await supabase.from('set_logs').insert({
          workout_log_id: logId,
          exercise_id: match.id,
          set_number: set.order,
          weight_kg: set.weight_kg,
          reps: set.reps,
          rir: set.rpe ? Math.max(0, 10 - set.rpe) : null,
          duration_sec: set.duration_sec || null,
          distance_m: set.distance_m || null,
          notes: set.notes || null,
        } as Record<string, unknown>);
        importedSets++;
      }
    }
  }

  // Update import record
  if (importRecord) {
    const importId = String(
      (importRecord as Record<string, unknown>).id,
    );
    await supabase
      .from('workout_imports')
      .update({
        status: 'completed',
        imported_workouts: importedWorkouts,
        imported_sets: importedSets,
        skipped,
        completed_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', importId);
  }

  return NextResponse.json({
    ok: true,
    source,
    imported_workouts: importedWorkouts,
    imported_sets: importedSets,
    skipped,
    total: workouts.length,
  });
}
