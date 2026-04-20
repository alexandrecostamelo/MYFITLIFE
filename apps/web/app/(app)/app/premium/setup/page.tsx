import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPremium } from '@/lib/premium/quota';
import { PremiumSetupClient, type Pool } from './premium-setup-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurar Premium — MyFitLife' };

export default async function PremiumSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPremium(user.id))) redirect('/app/plans');

  const { data: pools } = await supabase
    .from('premium_pools')
    .select('id, specialty, professional_id')
    .eq('is_active', true);

  // Enrich with professional info
  const profIds = [...new Set((pools || []).map((p: Record<string, unknown>) => p.professional_id as string))];
  const { data: profs } = profIds.length
    ? await supabase
        .from('professionals')
        .select('user_id, full_name, avatar_url, council_type, council_number, bio, city, state')
        .in('user_id', profIds)
    : { data: [] };

  const profMap = new Map(
    (profs || []).map((p: Record<string, unknown>) => [p.user_id as string, p]),
  );

  const enrichedPools = (pools || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    specialty: p.specialty as string,
    professional_id: p.professional_id as string,
    professional: profMap.get(p.professional_id as string) as Pool['professional'],
  }));

  const { data: assignments } = await supabase
    .from('premium_assignments')
    .select('professional_id, specialty')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const currentBySpec: Record<string, string> = {};
  for (const a of (assignments || []) as Record<string, unknown>[]) {
    currentBySpec[a.specialty as string] = a.professional_id as string;
  }

  return <PremiumSetupClient pools={enrichedPools} currentBySpec={currentBySpec} />;
}
