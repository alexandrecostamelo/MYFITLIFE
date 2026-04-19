import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: post } = await supabase.from('transformation_posts').select('*').eq('id', id).maybeSingle();
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const p = post as Record<string, unknown>;
  if (p.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await Promise.all([
    supabase.storage.from('transformations-public').remove([p.before_photo_path as string, p.after_photo_path as string]),
    supabase.from('transformation_posts').delete().eq('id', id),
  ]);

  return NextResponse.json({ ok: true });
}
