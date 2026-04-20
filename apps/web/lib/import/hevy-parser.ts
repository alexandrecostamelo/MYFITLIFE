import { type ParsedWorkout } from './strong-parser';

export function parseHevyCSV(content: string): ParsedWorkout[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/"/g, '').toLowerCase());

  const dateIdx = header.findIndex(
    (h) => h === 'date' || h === 'start_time',
  );
  const titleIdx = header.findIndex(
    (h) => h === 'title' || h === 'workout_name',
  );
  const exerciseIdx = header.findIndex(
    (h) => h === 'exercise_title' || h === 'exercise',
  );
  const setIdx = header.findIndex(
    (h) => h === 'set_index' || h === 'set',
  );
  const weightIdx = header.findIndex(
    (h) => h === 'weight_kg' || h === 'weight',
  );
  const repsIdx = header.findIndex((h) => h === 'reps');
  const rpeIdx = header.findIndex((h) => h === 'rpe');
  const notesIdx = header.findIndex(
    (h) => h === 'set_comment' || h === 'notes',
  );
  const durationIdx = header.findIndex(
    (h) => h === 'duration_seconds' || h === 'duration',
  );

  if (dateIdx === -1 || exerciseIdx === -1) return [];

  const workouts: Map<string, ParsedWorkout> = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''));
    const rawDate = cols[dateIdx];
    const date = rawDate?.slice(0, 10) || rawDate;
    const title = cols[titleIdx] || 'Treino Hevy';
    const exerciseName = cols[exerciseIdx];
    if (!date || !exerciseName) continue;

    const key = `${date}|${title}`;
    if (!workouts.has(key)) {
      workouts.set(key, { date, name: title, exercises: [] });
    }

    const workout = workouts.get(key)!;
    let exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }

    exercise.sets.push({
      order: parseInt(cols[setIdx]) || exercise.sets.length + 1,
      weight_kg: parseFloat(cols[weightIdx]) || 0,
      reps: parseInt(cols[repsIdx]) || 0,
      rpe: rpeIdx >= 0 ? parseFloat(cols[rpeIdx]) || undefined : undefined,
      duration_sec:
        durationIdx >= 0 ? parseInt(cols[durationIdx]) || undefined : undefined,
      notes: notesIdx >= 0 ? cols[notesIdx] || undefined : undefined,
    });
  }

  return Array.from(workouts.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
