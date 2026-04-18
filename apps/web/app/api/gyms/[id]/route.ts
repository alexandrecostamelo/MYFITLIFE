import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().optional(),
});

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: gym } = await supabase
    .from('user_gyms')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!gym) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: equipment } = await supabase
    .from('gym_equipment')
    .select('id, name, category, primary_muscles, confidence, added_manually, created_at')
    .eq('gym_id', id)
    .order('name');

  return NextResponse.json({ gym, equipment: equipment || [] });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  if (parsed.data.is_primary === true) {
    await supabase
      .from('user_gyms')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .neq('id', id);
  }

  const { error } = await supabase
    .from('user_gyms')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('user_gyms')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
