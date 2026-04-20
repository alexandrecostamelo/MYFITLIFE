import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { classifyBiomarkers } from '@/lib/health/biomarker-classifier';
import { BiomarkersClient } from './biomarkers-client';

export const dynamic = 'force-dynamic';

export default async function BiomarkersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Classify on page load
  await classifyBiomarkers(user.id);

  const { data: biomarkers } = await supabase
    .from('biomarkers')
    .select(
      'id, marker_name, value, unit, classification, measured_at, reference_min, reference_max',
    )
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false });

  return (
    <BiomarkersClient
      biomarkers={(biomarkers || []) as Record<string, unknown>[]}
    />
  );
}
