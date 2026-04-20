import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');
  const typeFilter = url.searchParams.get('type');
  const limit = Math.min(20, Number(url.searchParams.get('limit') || 10));

  let q = supabase
    .from('feed_posts')
    .select(`
      id, user_id, type, content, image_url, metadata, is_milestone,
      reaction_count, comment_count, created_at,
      author:profiles!user_id(id, full_name, username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) q = q.lt('created_at', cursor);
  if (typeFilter && typeFilter !== 'all') q = q.eq('type', typeFilter);

  const { data: posts, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (posts || []).map((p: any) => p.id);

  let reactionsByPost: Record<string, any[]> = {};
  let myReactions: Record<string, string[]> = {};
  if (postIds.length > 0) {
    const { data: reactions } = await supabase
      .from('feed_reactions')
      .select('post_id, emoji, user_id')
      .in('post_id', postIds);

    for (const r of reactions || []) {
      const rid = r as any;
      reactionsByPost[rid.post_id] = reactionsByPost[rid.post_id] || [];
      reactionsByPost[rid.post_id].push(rid);
      if (rid.user_id === user.id) {
        myReactions[rid.post_id] = myReactions[rid.post_id] || [];
        myReactions[rid.post_id].push(rid.emoji);
      }
    }
  }

  const enriched = (posts || []).map((p: any) => {
    const reactions = reactionsByPost[p.id] || [];
    const byEmoji: Record<string, number> = {};
    for (const r of reactions) byEmoji[r.emoji] = (byEmoji[r.emoji] || 0) + 1;
    return {
      ...p,
      reactions_by_emoji: byEmoji,
      my_reactions: myReactions[p.id] || [],
    };
  });

  const nextCursor = enriched.length === limit ? enriched[enriched.length - 1].created_at : null;

  return NextResponse.json({ posts: enriched, next_cursor: nextCursor });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { content, image_url } = body;

  if (!content?.trim() && !image_url) {
    return NextResponse.json({ error: 'content_required' }, { status: 400 });
  }
  if (content && content.length > 1000) {
    return NextResponse.json({ error: 'content_too_long' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: user.id,
      type: 'manual',
      content: content?.trim() || null,
      image_url: image_url || null,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
