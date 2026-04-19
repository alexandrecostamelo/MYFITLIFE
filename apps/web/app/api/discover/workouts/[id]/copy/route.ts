import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: source } = await supabase.from('workout_templates').select('*').eq('id', id).single();
  if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const s = source as Record<string, unknown>;
  if (!s.is_public) return NextResponse.json({ error: 'not_public' }, { status: 403 });
  if (s.user_id === user.id) return NextResponse.json({ error: 'own_template' }, { status: 400 });

  const { data: sourceExercises } = await supabase
    .from('workout_template_exercises')
    .select('*')
    .eq('workout_template_id', id)
    .order('order_index');

  const { data: sourceAuthor } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', s.user_id as string)
    .single();

  const authorLabel = (sourceAuthor as Record<string, unknown> | null)?.username
    || (sourceAuthor as Record<string, unknown> | null)?.full_name
    || 'alguém';

  const newName = `${s.name} (copiado de @${authorLabel})`;

  const { data: newTpl, error: insertErr } = await supabase
    .from('workout_templates')
    .insert({
      user_id: user.id,
      name: newName,
      description: s.description as string | null,
      is_public: false,
      objective: s.objective as string | null,
      difficulty: s.difficulty as string | null,
    })
    .select('id')
    .single();

  if (insertErr || !newTpl) return NextResponse.json({ error: insertErr?.message || 'insert_failed' }, { status: 500 });
  const newId = (newTpl as Record<string, unknown>).id as string;

  if (sourceExercises && sourceExercises.length > 0) {
    const newExercises = sourceExercises.map((e: Record<string, unknown>) => ({
      workout_template_id: newId,
      exercise_id: e.exercise_id,
      order_index: e.order_index,
      sets: e.sets,
      reps: e.reps,
      weight_kg: e.weight_kg,
      rest_sec: e.rest_sec,
      notes: e.notes,
    }));
    await supabase.from('workout_template_exercises').insert(newExercises);
  }

  await supabase.from('workout_template_copies').insert({
    source_template_id: id,
    source_user_id: s.user_id as string,
    copied_template_id: newId,
    copier_user_id: user.id,
  });

  await supabase
    .from('workout_templates')
    .update({ copy_count: (s.copy_count as number) + 1 })
    .eq('id', id);

  return NextResponse.json({ new_template_id: newId });
}
