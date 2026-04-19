import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: existing } = await supabase
    .from('transformation_inspires')
    .select('id')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('transformation_inspires').delete().eq('id', (existing as Record<string, unknown>).id as string);
    const { data: post } = await supabase.from('transformation_posts').select('inspires_count').eq('id', id).maybeSingle();
    if (post) {
      const p = post as Record<string, unknown>;
      await supabase.from('transformation_posts').update({ inspires_count: Math.max(0, (Number(p.inspires_count) || 0) - 1) }).eq('id', id);
    }
    return NextResponse.json({ inspired: false });
  }

  await supabase.from('transformation_inspires').insert({ post_id: id, user_id: user.id });
  const { data: post } = await supabase.from('transformation_posts').select('inspires_count').eq('id', id).maybeSingle();
  if (post) {
    const p = post as Record<string, unknown>;
    await supabase.from('transformation_posts').update({ inspires_count: (Number(p.inspires_count) || 0) + 1 }).eq('id', id);
  }

  return NextResponse.json({ inspired: true });
}
