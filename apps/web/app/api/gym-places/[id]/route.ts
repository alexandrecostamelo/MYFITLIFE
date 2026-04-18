import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: gym } = await supabase
    .from('gym_places')
    .select('*')
    .eq('id', id)
    .single();

  if (!gym) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: myReview } = await supabase
    .from('gym_reviews')
    .select('id, rating, comment, created_at')
    .eq('gym_place_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: recentReviews } = await supabase
    .from('gym_reviews')
    .select('rating, comment, created_at, user_id')
    .eq('gym_place_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviewUserIds = (recentReviews || []).map((r: any) => r.user_id);
  const { data: profiles } = reviewUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username').in('id', reviewUserIds)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const reviewsWithUsers = (recentReviews || []).map((r: any) => ({
    ...r,
    user: profMap.get(r.user_id) || { full_name: 'Usuário' },
  }));

  const { data: myLinkedGym } = await supabase
    .from('user_gyms')
    .select('id')
    .eq('user_id', user.id)
    .eq('gym_place_id', id)
    .maybeSingle();

  return NextResponse.json({
    gym,
    my_review: myReview,
    recent_reviews: reviewsWithUsers,
    my_linked_user_gym_id: myLinkedGym?.id || null,
  });
}
