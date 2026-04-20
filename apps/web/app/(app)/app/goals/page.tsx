import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoalsClient } from './goals-client';
import { calculateWeightPrediction } from '@/lib/predictions/weight';
import type { WeightPredictionResult } from '@/lib/predictions/weight';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [goalsRes, prediction] = await Promise.all([
    supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false }),
    calculateWeightPrediction(user.id),
  ]);

  return (
    <GoalsClient
      goals={(goalsRes.data || []) as Record<string, unknown>[]}
      prediction={prediction}
    />
  );
}
