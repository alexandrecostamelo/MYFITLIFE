import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id)))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const [profileRes, subRes, workoutsRes, mealsRes, paymentsRes, aiUsageRes] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('meal_logs').select('id', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('payment_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    admin.from('ai_usage_log').select('id', { count: 'exact', head: true }).eq('user_id', id),
  ]);

  return NextResponse.json({
    profile: profileRes.data,
    subscription: subRes.data,
    stats: {
      total_workouts: workoutsRes.count || 0,
      total_meals: mealsRes.count || 0,
      total_ai_calls: aiUsageRes.count || 0,
    },
    recent_payments: paymentsRes.data || [],
  });
}
