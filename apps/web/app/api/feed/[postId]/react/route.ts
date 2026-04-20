import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_EMOJIS = ['fire', 'muscle', 'clap', 'heart', 'angry'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { emoji } = await req.json();
  if (!VALID_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'invalid_emoji' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('feed_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from('feed_reactions').delete().eq('id', existing.id);
    return NextResponse.json({ action: 'removed' });
  } else {
    await supabase.from('feed_reactions').insert({
      post_id: postId,
      user_id: user.id,
      emoji,
    } as Record<string, unknown>);
    return NextResponse.json({ action: 'added' });
  }
}
