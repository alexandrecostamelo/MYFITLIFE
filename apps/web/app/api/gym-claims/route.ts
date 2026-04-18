import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: claims } = await supabase
    .from('gym_claims')
    .select('*, gym_place:gym_places(id, name, city, state)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ claims: claims ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { gym_place_id, message } = body;
  if (!gym_place_id) return NextResponse.json({ error: 'gym_place_id required' }, { status: 400 });

  // Check if gym is already claimed
  const { data: gym } = await supabase
    .from('gym_places')
    .select('claimed_by')
    .eq('id', gym_place_id)
    .single();

  if (gym?.claimed_by) {
    return NextResponse.json({ error: 'already_claimed' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('gym_claims')
    .upsert(
      { gym_place_id, user_id: user.id, message: message ?? null, status: 'pending' },
      { onConflict: 'gym_place_id,user_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ claim: data });
}
