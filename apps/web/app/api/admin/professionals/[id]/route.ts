import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['verify', 'unverify', 'deactivate', 'reactivate']),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.action === 'verify') updates.verified = true;
  if (parsed.data.action === 'unverify') updates.verified = false;
  if (parsed.data.action === 'deactivate') updates.active = false;
  if (parsed.data.action === 'reactivate') updates.active = true;

  const { error } = await supabase.from('professionals').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
