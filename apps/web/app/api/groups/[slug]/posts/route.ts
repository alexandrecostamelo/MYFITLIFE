import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: group } = await supabase
    .from('community_groups')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const cursor = req.nextUrl.searchParams.get('before');

  let query = supabase
    .from('community_posts')
    .select('*')
    .eq('group_id', group.id)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (cursor) query = query.lt('created_at', cursor);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = Array.from(new Set((posts || []).map((p: any) => p.author_id)));
  const postIds = (posts || []).map((p: any) => p.id);

  const [profilesRes, likesRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const profMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
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
      group: null,
      photo_url: photoUrl,
      liked_by_me: likedPosts.has(p.id),
    };
  });

  return NextResponse.json({ posts: enriched });
}
