import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('professional_favorites')
    .select('professional_id, professionals(id, profession, full_name, city, state, avatar_url, rating_avg, rating_count, specialties, verified)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const list = (data || [])
    .map((f: any) => f.professionals)
    .filter(Boolean);

  return NextResponse.json({ favorites: list });
}
