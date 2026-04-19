import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: group } = await supabase.from('community_groups').select('*').eq('slug', slug).single();
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ group, is_member: !!membership });
}
