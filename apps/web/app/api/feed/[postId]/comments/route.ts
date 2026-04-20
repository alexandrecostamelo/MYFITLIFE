import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('feed_comments')
    .select(`
      id, post_id, parent_comment_id, content, created_at,
      author:profiles!user_id(id, username, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(200);

  return NextResponse.json({ comments: data || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { content, parent_comment_id } = await req.json();
  if (!content?.trim() || content.length > 500) {
    return NextResponse.json({ error: 'invalid_content' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: postId,
      parent_comment_id: parent_comment_id || null,
      user_id: user.id,
      content: content.trim(),
    } as Record<string, unknown>)
    .select(`
      id, post_id, parent_comment_id, content, created_at,
      author:profiles!user_id(id, username, full_name, avatar_url)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
