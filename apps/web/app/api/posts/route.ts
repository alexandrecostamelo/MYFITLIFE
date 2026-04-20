import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyTextModeration, logModerationAction } from '@/lib/moderation/apply';
import { z } from 'zod';

export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const createSchema = z.object({
  content: z.string().min(1).max(2000),
  group_id: z.string().uuid().optional(),
});

async function getBlockedUserIds(supabase: any, userId: string): Promise<string[]> {
  const [{ data: blocks }, { data: blockedBy }] = await Promise.all([
    supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId),
    supabase.from('user_blocks').select('blocker_id').eq('blocked_id', userId),
  ]);
  return [
    ...(blocks || []).map((b: any) => b.blocked_id),
    ...(blockedBy || []).map((b: any) => b.blocker_id),
  ];
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const feedType = req.nextUrl.searchParams.get('feed') || 'home';
  const groupSlug = req.nextUrl.searchParams.get('group');
  const before = req.nextUrl.searchParams.get('before');

  const blocked = await getBlockedUserIds(supabase, user.id);

  let groupId: string | null = null;
  if (groupSlug) {
    const { data: g } = await supabase.from('community_groups').select('id').eq('slug', groupSlug).single();
    groupId = g?.id || null;
  }

  let query = supabase
    .from('community_posts')
    .select('*')
    .or(`moderation_status.eq.approved,and(moderation_status.eq.pending_review,author_id.eq.${user.id})`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (before) query = query.lt('created_at', before);
  if (blocked.length > 0) query = query.not('author_id', 'in', `(${blocked.join(',')})`);

  if (groupId) {
    query = query.eq('group_id', groupId);
  } else if (feedType === 'friends') {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const friendIds = (friendships || []).map((f: any) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );
    friendIds.push(user.id);

    if (friendIds.length > 0) {
      query = query.in('author_id', friendIds);
    }
  } else if (feedType === 'groups') {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    const groupIds = (memberships || []).map((m: any) => m.group_id);
    if (groupIds.length > 0) {
      query = query.in('group_id', groupIds);
    } else {
      return NextResponse.json({ posts: [] });
    }
  }

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = Array.from(new Set((posts || []).map((p: any) => p.author_id)));
  const groupIds = Array.from(new Set((posts || []).map((p: any) => p.group_id).filter(Boolean)));
  const postIds = (posts || []).map((p: any) => p.id);

  const [profilesRes, groupsRes, likesRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [] }),
    groupIds.length > 0
      ? supabase.from('community_groups').select('id, slug, name, cover_emoji').in('id', groupIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const profMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
  const groupMap = new Map((groupsRes.data || []).map((g: any) => [g.id, g]));
  const likedPosts = new Set((likesRes.data || []).map((l: any) => l.post_id));

  const enriched = (posts || []).map((p: any) => {
    let photoUrl: string | null = null;
    if (p.photo_path) {
      const { data } = supabase.storage.from('post-photos').getPublicUrl(p.photo_path);
      photoUrl = data.publicUrl;
    }
    return {
      ...p,
      author: profMap.get(p.author_id) || { full_name: 'Usuário' },
      group: p.group_id ? groupMap.get(p.group_id) : null,
      photo_url: photoUrl,
      liked_by_me: likedPosts.has(p.id),
    };
  });

  return NextResponse.json({ posts: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';

  let content: string;
  let groupId: string | undefined;
  let photoFile: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    content = (formData.get('content') as string) || '';
    groupId = (formData.get('group_id') as string) || undefined;
    photoFile = formData.get('photo') as File | null;
  } else {
    const body = await req.json();
    content = body.content;
    groupId = body.group_id;
  }

  const parsed = createSchema.safeParse({ content, group_id: groupId || undefined });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  if (groupId) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: 'not_member' }, { status: 403 });
  }

  const context = groupId ? 'group' : 'feed';
  const mod = await applyTextModeration(parsed.data.content, user.id, context);

  if (mod.decision === 'rejected') {
    return NextResponse.json({
      error: 'content_rejected',
      message: `Post bloqueado: ${mod.reason}`,
      categories: mod.categories,
      moderation_status: 'rejected',
      moderation_reason: mod.reason,
    }, { status: 422 });
  }

  let photoPath: string | null = null;
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
    const arrayBuf = await photoFile.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuf));
    let uploadBuffer: Buffer = buffer;
    let uploadContentType = photoFile.type || 'image/jpeg';
    try {
      const sharp = (await import('sharp')).default;
      uploadBuffer = await sharp(buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      uploadContentType = 'image/jpeg';
    } catch { /* sharp not available */ }

    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { data: uploaded, error: uploadErr } = await supabase.storage
      .from('post-photos')
      .upload(fileName, uploadBuffer, { contentType: uploadContentType });
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    photoPath = uploaded.path;
  }

  const { data: created, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: user.id,
      group_id: groupId || null,
      content: parsed.data.content,
      photo_path: photoPath,
      moderation_status: mod.decision,
      moderation_reason: mod.reason,
      moderation_categories: mod.categories,
      ai_moderation_score: mod.score,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logModerationAction(
    null, 'post', created.id, user.id,
    mod.decision === 'approved' ? 'approve' : 'remove',
    mod.reason || 'Moderação automática IA',
    'ai_auto',
  ).catch(console.error);

  return NextResponse.json({
    id: created.id,
    moderation_status: mod.decision,
    moderation_reason: mod.reason,
  });
}
