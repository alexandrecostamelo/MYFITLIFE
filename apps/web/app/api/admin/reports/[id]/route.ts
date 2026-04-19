import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['remove_content', 'dismiss']),
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

  const { data: report } = await supabase.from('content_reports').select('*').eq('id', id).single();
  if (!report) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (parsed.data.action === 'remove_content') {
    if (report.target_type === 'post') {
      await supabase.from('community_posts').update({
        moderation_status: 'removed',
        removed_by: user.id,
      }).eq('id', report.target_id);
    } else if (report.target_type === 'comment') {
      await supabase.from('post_comments').update({
        moderation_status: 'removed',
      }).eq('id', report.target_id);
    }
  }

  await supabase.from('content_reports').update({
    status: parsed.data.action === 'dismiss' ? 'dismissed' : 'reviewed',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);

  return NextResponse.json({ ok: true });
}
