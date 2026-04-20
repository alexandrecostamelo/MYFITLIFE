import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const maxDuration = 60;

interface ImportRow {
  workoutLabel: string;
  exerciseId: string | null;
  exerciseNameInput: string;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  notes: string;
  skip: boolean;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const rows: ImportRow[] = body.rows || [];
  const fileName: string = body.file_name || 'import.xlsx';

  if (rows.length === 0) return NextResponse.json({ error: 'no_rows' }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: 'too_many_rows', limit: 500 }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: importRecord } = await admin
    .from('workout_imports')
    .insert({
      user_id: user.id,
      file_name: fileName,
      rows_parsed: rows.length,
      status: 'processing',
    } as Record<string, unknown>)
    .select()
    .single();

  const importId = importRecord!.id as string;

  try {
    const effective = rows.filter((r) => !r.skip && r.exerciseId);
    const skipped = rows.length - effective.length;

    // Group by workout label
    const byWorkout = new Map<string, ImportRow[]>();
    for (const row of effective) {
      const label = row.workoutLabel || 'Treino A';
      if (!byWorkout.has(label)) byWorkout.set(label, []);
      byWorkout.get(label)!.push(row);
    }

    let workoutsCreated = 0;
    let exercisesCreated = 0;
    const templateIds: string[] = [];

    for (const [label, items] of byWorkout.entries()) {
      const { data: template, error: tplErr } = await admin
        .from('workout_templates')
        .insert({
          user_id: user.id,
          name: label,
          description: `Importado de ${fileName}`,
        } as Record<string, unknown>)
        .select('id')
        .single();

      if (tplErr) throw new Error(`Falha ao criar template "${label}": ${tplErr.message}`);
      templateIds.push(template.id as string);
      workoutsCreated++;

      const exerciseInserts = items.map((item, idx) => ({
        workout_template_id: template.id,
        exercise_id: item.exerciseId,
        order_index: idx,
        sets: item.sets,
        reps: item.reps,
        rest_sec: item.restSeconds,
        weight_kg: item.weightKg,
        notes: item.notes || null,
      }));

      const { error: exErr } = await admin
        .from('workout_template_exercises')
        .insert(exerciseInserts as Record<string, unknown>[]);

      if (exErr) throw new Error(`Falha ao inserir exercícios: ${exErr.message}`);
      exercisesCreated += exerciseInserts.length;
    }

    await admin
      .from('workout_imports')
      .update({
        status: 'completed',
        rows_matched: effective.length,
        rows_skipped: skipped,
        rows_created: exercisesCreated,
        workouts_created: workoutsCreated,
      } as Record<string, unknown>)
      .eq('id', importId);

    return NextResponse.json({
      ok: true,
      import_id: importId,
      workouts_created: workoutsCreated,
      exercises_created: exercisesCreated,
      skipped,
      template_ids: templateIds,
    });
  } catch (err: any) {
    await admin
      .from('workout_imports')
      .update({ status: 'failed', error_message: err.message } as Record<string, unknown>)
      .eq('id', importId);
    return NextResponse.json({ error: 'import_failed', message: err.message }, { status: 500 });
  }
}
