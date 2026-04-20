import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  target_type: z.enum(['post', 'comment', 'user']),
  target_id: z.string().uuid(),
  reason: z.enum([
    'spam', 'harassment', 'eating_disorder', 'hate_speech', 'inappropriate', 'other',
    'nudity', 'violence', 'misinformation', 'self_harm', 'dangerous_advice', 'impersonation',
  ]),
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

  // Auto-escalate: 3+ pending reports on same content -> pending_review
  if (parsed.data.target_type === 'post') {
    const { count } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'post')
      .eq('target_id', parsed.data.target_id)
      .eq('status', 'pending');

    if ((count || 0) >= 3) {
      await supabase
        .from('community_posts')
        .update({ moderation_status: 'pending_review' } as Record<string, unknown>)
        .eq('id', parsed.data.target_id)
        .eq('moderation_status', 'approved');
    }
  }

  return NextResponse.json({ ok: true });
}
