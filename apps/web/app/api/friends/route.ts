import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .in('status', ['accepted', 'pending']);

  const allIds = new Set<string>();
  (friendships || []).forEach((f: any) => {
    if (f.requester_id !== user.id) allIds.add(f.requester_id);
    if (f.addressee_id !== user.id) allIds.add(f.addressee_id);
  });

  const idsArray = Array.from(allIds);

  const profilesMap: Record<string, any> = {};
  const statsMap: Record<string, any> = {};

  if (idsArray.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', idsArray);
    (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });

    const { data: stats } = await supabase
      .from('user_stats')
      .select('user_id, level, total_xp, current_streak')
      .in('user_id', idsArray);
    (stats || []).forEach((s: any) => { statsMap[s.user_id] = s; });
  }

  const accepted: any[] = [];
  const incoming: any[] = [];
  const outgoing: any[] = [];

  (friendships || []).forEach((f: any) => {
    const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
    const entry = {
      friendship_id: f.id,
      status: f.status,
      user: profilesMap[otherId] || { id: otherId },
      stats: statsMap[otherId] || null,
      created_at: f.created_at,
    };

    if (f.status === 'accepted') accepted.push(entry);
    else if (f.status === 'pending' && f.addressee_id === user.id) incoming.push(entry);
    else if (f.status === 'pending' && f.requester_id === user.id) outgoing.push(entry);
  });

  return NextResponse.json({ accepted, incoming, outgoing });
}
