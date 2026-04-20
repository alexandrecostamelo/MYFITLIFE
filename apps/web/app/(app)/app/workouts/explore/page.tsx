import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExploreClient } from './explore-client';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [contextualRes, challengesRes, progressRes] = await Promise.all([
    supabase.from('contextual_workouts').select('*').order('context').order('difficulty'),
    supabase
      .from('mini_challenges')
      .select('*')
      .eq('is_active', true)
      .order('total_days'),
    supabase
      .from('user_mini_challenge_progress')
      .select('challenge_id, current_day, completed_days, completed_at')
      .eq('user_id', user.id),
  ]);

  return (
    <ExploreClient
      contextual={(contextualRes.data || []) as Record<string, unknown>[]}
      challenges={(challengesRes.data || []) as Record<string, unknown>[]}
      progress={(progressRes.data || []) as Record<string, unknown>[]}
    />
  );
}
