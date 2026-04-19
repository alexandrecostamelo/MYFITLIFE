import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: prof } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
  if (!prof) return NextResponse.json({ error: 'not_professional' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await supabase
    .from('professional_blocked_dates')
    .upsert({
      professional_id: prof.id,
      blocked_date: parsed.data.blocked_date,
      reason: parsed.data.reason,
    }, { onConflict: 'professional_id,blocked_date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
