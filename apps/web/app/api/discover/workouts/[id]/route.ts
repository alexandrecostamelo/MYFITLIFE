import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: tpl } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (!tpl) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const t = tpl as Record<string, unknown>;
  if (!t.is_public && t.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const [exRes, authorRes, iCopiedRes] = await Promise.all([
    supabase.from('workout_template_exercises').select('*').eq('workout_template_id', id).order('order_index'),
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', t.user_id as string).single(),
    supabase.from('workout_template_copies').select('id').eq('source_template_id', id).eq('copier_user_id', user.id).maybeSingle(),
  ]);

  const exerciseIds = (exRes.data || [])
    .map((e: Record<string, unknown>) => e.exercise_id)
    .filter(Boolean);

  const { data: exercises } = exerciseIds.length > 0
    ? await supabase.from('exercises').select('id, name_pt, category, primary_muscles').in('id', exerciseIds as string[])
    : { data: [] };

  const exMap = new Map((exercises || []).map((e: Record<string, unknown>) => [e.id as string, e]));

  const enrichedExercises = (exRes.data || []).map((e: Record<string, unknown>) => ({
    ...e,
    exercise: exMap.get(e.exercise_id as string) || null,
  }));

  return NextResponse.json({
    template: tpl,
    exercises: enrichedExercises,
    author: authorRes.data,
    already_copied: !!iCopiedRes.data,
  });
}
