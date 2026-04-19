import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  is_public: z.boolean(),
  public_description: z.string().max(500).optional(),
  objective: z.enum(['hypertrophy', 'strength', 'weight_loss', 'endurance', 'general_fitness', 'rehab']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: tpl } = await supabase.from('workout_templates').select('user_id').eq('id', id).single();
  if (!tpl) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if ((tpl as Record<string, unknown>).user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updates: Record<string, unknown> = {
    is_public: parsed.data.is_public,
  };
  if (parsed.data.is_public) {
    updates.last_published_at = new Date().toISOString();
    if (parsed.data.public_description !== undefined) updates.public_description = parsed.data.public_description;
    if (parsed.data.objective) updates.objective = parsed.data.objective;
    if (parsed.data.difficulty) updates.difficulty = parsed.data.difficulty;
  }

  const { error } = await supabase.from('workout_templates').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
