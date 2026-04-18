import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: trails } = await supabase
    .from('trails')
    .select('id, slug, title, subtitle, description, duration_days, level, goal, cover_emoji, is_premium')
    .order('duration_days');

  const { data: userTrails } = await supabase
    .from('user_trails')
    .select('trail_id, current_day, days_completed, completed_at, abandoned')
    .eq('user_id', user.id);

  const utMap = new Map((userTrails || []).map((ut: any) => [ut.trail_id, ut]));

  return NextResponse.json({
    trails: (trails || []).map((t: any) => ({
      ...t,
      user_state: utMap.get(t.id) || null,
    })),
  });
}
