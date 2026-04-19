import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: groups } = await supabase
    .from('community_groups')
    .select('*')
    .order('member_count', { ascending: false });

  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const myGroupIds = new Set((myMemberships || []).map((m: any) => m.group_id));

  const enriched = (groups || []).map((g: any) => ({
    ...g,
    is_member: myGroupIds.has(g.id),
  }));

  return NextResponse.json({ groups: enriched });
}
