import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data } = await supabase
    .from('professionals')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ professionals: data || [] });
}
