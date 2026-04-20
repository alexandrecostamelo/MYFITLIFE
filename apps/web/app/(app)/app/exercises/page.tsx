import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExerciseLibraryClient } from './exercise-library-client';

export const dynamic = 'force-dynamic';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  legs: 'Pernas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  cardio: 'Cardio',
  glutes: 'Glúteos',
  gluteus: 'Glúteos',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posteriores',
  calves: 'Panturrilhas',
  forearms: 'Antebraços',
  full_body: 'Full Body',
  upper_back: 'Superior Costas',
  lower_back: 'Lombar',
  traps: 'Trapézio',
  lats: 'Dorsais',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  hip_flexors: 'Flexores Quadril',
  adductors: 'Adutores',
  abductors: 'Abdutores',
};

export default async function ExerciseLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: exercises } = await supabase
    .from('exercises')
    .select(
      'id, name_pt, primary_muscles, secondary_muscles, equipment, difficulty, level, estimated_kcal_per_set, thumbnail_url'
    )
    .order('name_pt');

  const groups: Record<string, { count: number }> = {};
  for (const ex of (exercises || []) as Record<string, unknown>[]) {
    const muscles = Array.isArray(ex.primary_muscles)
      ? (ex.primary_muscles as string[])
      : [];
    for (const m of muscles) {
      const key = m.toLowerCase().replace(/\s+/g, '_');
      if (!groups[key]) groups[key] = { count: 0 };
      groups[key].count++;
    }
  }

  const muscleGroups = Object.entries(groups)
    .map(([id, g]) => ({
      id,
      name: MUSCLE_LABELS[id] || id,
      exerciseCount: g.count,
    }))
    .sort((a, b) => b.exerciseCount - a.exerciseCount);

  return (
    <ExerciseLibraryClient
      exercises={(exercises || []) as Record<string, unknown>[]}
      muscleGroups={muscleGroups}
    />
  );
}
