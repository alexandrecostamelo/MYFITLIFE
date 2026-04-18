import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single();

  if (!professional) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: myReview } = await supabase
    .from('professional_reviews')
    .select('rating, comment')
    .eq('professional_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from('professional_reviews')
    .select('rating, comment, created_at, user_id')
    .eq('professional_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviewUserIds = (reviews || []).map((r: any) => r.user_id);
  const { data: profiles } = reviewUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username').in('id', reviewUserIds)
    : { data: [] };
  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const reviewsEnriched = (reviews || []).map((r: any) => ({
    ...r,
    user: profMap.get(r.user_id) || { full_name: 'Usuário' },
  }));

  const { data: favorite } = await supabase
    .from('professional_favorites')
    .select('id')
    .eq('professional_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    professional,
    my_review: myReview,
    recent_reviews: reviewsEnriched,
    is_favorite: !!favorite,
  });
}
