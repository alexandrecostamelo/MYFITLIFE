import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
  rollout_pct: z.number().int().min(0).max(100).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data } = await supabase.from('feature_flags').select('*').order('key');
  return NextResponse.json({ flags: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { id, ...updates } = parsed.data;
  const { error } = await supabase
    .from('feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
