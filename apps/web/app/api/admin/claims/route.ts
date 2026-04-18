import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: claims } = await supabase
    .from('gym_claims')
    .select('*, gym_place:gym_places(id, name, city, state), user:profiles(id, full_name, username)')
    .order('created_at', { ascending: false });

  return NextResponse.json({ claims: claims ?? [] });
}
