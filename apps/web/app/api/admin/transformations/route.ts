import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || 'pending';

  const { data: posts } = await supabase
    .from('transformation_posts')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' });

  const userIds = Array.from(new Set((posts || []).map((p: Record<string, unknown>) => p.user_id as string)));
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username').in('id', userIds)
    : { data: [] };
  const profMap = new Map((profiles || []).map((p: Record<string, unknown>) => [p.id as string, p]));

  const enriched = (posts || []).map((p: Record<string, unknown>) => ({
    ...p,
    author: profMap.get(p.user_id as string),
    before_url: supabase.storage.from('transformations-public').getPublicUrl(p.before_photo_path as string).data.publicUrl,
    after_url: supabase.storage.from('transformations-public').getPublicUrl(p.after_photo_path as string).data.publicUrl,
  }));

  return NextResponse.json({ posts: enriched });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'feature', 'unfeature', 'remove']),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.action === 'approve') {
    updates.status = 'approved';
    updates.approved_at = new Date().toISOString();
    updates.reject_reason = null;
  } else if (parsed.data.action === 'reject') {
    updates.status = 'rejected';
    updates.reject_reason = parsed.data.reason || 'não especificado';
  } else if (parsed.data.action === 'feature') {
    updates.featured = true;
  } else if (parsed.data.action === 'unfeature') {
    updates.featured = false;
  } else if (parsed.data.action === 'remove') {
    updates.status = 'removed';
    updates.removed_at = new Date().toISOString();
  }

  await supabase.from('transformation_posts').update(updates).eq('id', parsed.data.id);
  return NextResponse.json({ ok: true });
}
