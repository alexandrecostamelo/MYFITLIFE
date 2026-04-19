import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  target_type: z.enum(['post', 'comment', 'user']),
  target_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'eating_disorder', 'hate_speech', 'inappropriate', 'other']),
  details: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
