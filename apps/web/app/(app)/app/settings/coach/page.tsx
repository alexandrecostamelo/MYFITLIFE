import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoachSelectionClient } from '../../onboarding/coach/coach-selection-client';

export const dynamic = 'force-dynamic';

export default async function CoachSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('coach_persona')
    .eq('id', user.id)
    .single();

  const currentPersona = String(data?.coach_persona || 'leo');

  return <CoachSelectionClient isOnboarding={false} currentPersona={currentPersona} />;
}
