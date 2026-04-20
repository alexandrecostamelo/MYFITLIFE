export interface ParsedWorkout {
  date: string;
  name: string;
  exercises: {
    name: string;
    sets: {
      order: number;
      weight_kg: number;
      reps: number;
      duration_sec?: number;
      distance_m?: number;
      rpe?: number;
      notes?: string;
    }[];
  }[];
  duration_minutes?: number;
  notes?: string;
}

export function parseStrongCSV(content: string): ParsedWorkout[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/"/g, '').toLowerCase());

  const dateIdx = header.findIndex((h) => h === 'date');
  const workoutIdx = header.findIndex(
    (h) => h.includes('workout name') || h === 'workout',
  );
  const exerciseIdx = header.findIndex(
    (h) => h.includes('exercise name') || h === 'exercise',
  );
  const setIdx = header.findIndex(
    (h) => h.includes('set order') || h === 'set',
  );
  const weightIdx = header.findIndex(
    (h) => h === 'weight' || h === 'weight (kg)',
  );
  const repsIdx = header.findIndex((h) => h === 'reps');
  const durationIdx = header.findIndex(
    (h) => h === 'duration' || h.includes('seconds'),
  );
  const distanceIdx = header.findIndex((h) => h.includes('distance'));
  const notesIdx = header.findIndex(
    (h) => h === 'notes' || h === 'workout notes',
  );

  if (dateIdx === -1 || exerciseIdx === -1) return [];

  const workouts: Map<string, ParsedWorkout> = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const date = cols[dateIdx]?.trim();
    const workoutName = cols[workoutIdx]?.trim() || 'Treino Importado';
    const exerciseName = cols[exerciseIdx]?.trim();
    if (!date || !exerciseName) continue;

    const key = `${date}|${workoutName}`;
    if (!workouts.has(key)) {
      workouts.set(key, {
        date,
        name: workoutName,
        exercises: [],
        notes: notesIdx >= 0 ? cols[notesIdx]?.trim() : undefined,
      });
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
      duration_sec:
        durationIdx >= 0 ? parseInt(cols[durationIdx]) || undefined : undefined,
      distance_m:
        distanceIdx >= 0
          ? parseFloat(cols[distanceIdx]) || undefined
          : undefined,
    });
  }

  return Array.from(workouts.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}
