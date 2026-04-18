import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canViewGymAnalytics } from '@/lib/auth-helpers';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const canView = await canViewGymAnalytics(supabase, user.id, id);
  if (!canView) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(365, Math.max(7, Number(searchParams.get('days') ?? 30)));

  const { data, error } = await supabase.rpc('gym_analytics', {
    p_gym_place_id: id,
    p_days: days,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ analytics: data });
}
