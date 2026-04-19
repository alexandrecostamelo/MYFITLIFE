import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAllCache } from '@myfitlife/ai/cache';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await clearAllCache();
  return NextResponse.json({ ok: true });
}
