import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  show_in_public_rankings: z.boolean().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('show_in_public_rankings, city, state')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ prefs: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.show_in_public_rankings !== undefined) {
    updates.show_in_public_rankings = parsed.data.show_in_public_rankings;
  }
  if (parsed.data.city !== undefined) updates.city = parsed.data.city || null;
  if (parsed.data.state !== undefined) updates.state = parsed.data.state?.toUpperCase() || null;

  await supabase.from('user_profiles').update(updates).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
