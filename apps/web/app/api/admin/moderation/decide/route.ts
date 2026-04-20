import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { logModerationAction, warnUser, banUser } from '@/lib/moderation/apply';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { content_id, action } = await req.json();
  if (!content_id || !action) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: post } = await admin
    .from('community_posts')
    .select('author_id')
    .eq('id', content_id)
    .single();

  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const authorId = post.author_id as string;

  if (action === 'approve') {
    await admin.from('community_posts')
      .update({ moderation_status: 'approved' } as Record<string, unknown>)
      .eq('id', content_id);
    await logModerationAction(user.id, 'post', content_id, authorId, 'approve', 'Aprovado por moderador', 'human');
  } else if (action === 'remove') {
    await admin.from('community_posts')
      .update({ moderation_status: 'removed', removed_by: user.id } as Record<string, unknown>)
      .eq('id', content_id);
    await logModerationAction(user.id, 'post', content_id, authorId, 'remove', 'Removido por moderador', 'human');
  } else if (action === 'warn') {
    await admin.from('community_posts')
      .update({ moderation_status: 'removed', removed_by: user.id } as Record<string, unknown>)
      .eq('id', content_id);
    await warnUser(authorId, 'Conteúdo inadequado');
    await logModerationAction(user.id, 'post', content_id, authorId, 'warn_author', 'Remoção + aviso', 'human');
  } else if (action === 'ban') {
    await admin.from('community_posts')
      .update({ moderation_status: 'removed', removed_by: user.id } as Record<string, unknown>)
      .eq('id', content_id);
    await banUser(authorId, 'Violação grave das regras', 7);
    await logModerationAction(user.id, 'post', content_id, authorId, 'ban_author', 'Ban 7 dias', 'human');
  } else {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
