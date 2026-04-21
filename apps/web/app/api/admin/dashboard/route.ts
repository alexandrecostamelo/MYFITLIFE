import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id)))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  // Total users
  const { count: totalUsers } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Active users (logged in last 7 days via ai_usage_log or workout_logs)
  const { data: recentActiveRows } = await admin
    .from('ai_usage_log')
    .select('user_id')
    .gte('created_at', sevenDaysAgo)
    .not('user_id', 'is', null)
    .limit(10000);
  const activeUserIds = new Set((recentActiveRows || []).map((r: any) => r.user_id));

  // New users this month
  const { count: newUsersThisMonth } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thisMonthStart);

  // New users last month
  const { count: newUsersLastMonth } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', lastMonthStart)
    .lte('created_at', lastMonthEnd);

  // Active subscriptions
  const { data: activeSubs } = await admin
    .from('subscriptions')
    .select('plan, billing_cycle, status')
    .in('status', ['active', 'trialing']);

  // Canceled last 30 days
  const { count: canceledLast30 } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('updated_at', thirtyDaysAgo);

  // Calculate MRR
  const PLAN_PRICES: Record<string, number> = {
    pro_monthly: 2990,
    pro_yearly: Math.round(24990 / 12),
    premium_monthly: 9990,
    premium_yearly: Math.round(99900 / 12),
  };

  let mrr = 0;
  const tierCounts: Record<string, number> = { free: 0, pro: 0, premium: 0 };
  for (const sub of activeSubs || []) {
    const key = `${sub.plan}_${sub.billing_cycle}`;
    mrr += PLAN_PRICES[key] || 0;
    tierCounts[sub.plan as string] = (tierCounts[sub.plan as string] || 0) + 1;
  }

  // Revenue this month (payment_transactions)
  const { data: txnThisMonth } = await admin
    .from('payment_transactions')
    .select('amount_cents')
    .eq('status', 'paid')
    .gte('created_at', thisMonthStart);

  const revenueThisMonth = (txnThisMonth || []).reduce(
    (sum: number, t: any) => sum + (Number(t.amount_cents) || 0),
    0,
  );

  // Transactions last month
  const { data: txnLastMonth } = await admin
    .from('payment_transactions')
    .select('amount_cents')
    .eq('status', 'paid')
    .gte('created_at', lastMonthStart)
    .lte('created_at', lastMonthEnd);

  const revenueLastMonth = (txnLastMonth || []).reduce(
    (sum: number, t: any) => sum + (Number(t.amount_cents) || 0),
    0,
  );

  const totalActive = (activeSubs || []).length;
  const churnRate =
    totalActive + (canceledLast30 || 0) > 0
      ? ((canceledLast30 || 0) / (totalActive + (canceledLast30 || 0))) * 100
      : 0;

  const growthPct =
    (newUsersLastMonth || 0) > 0
      ? (((newUsersThisMonth || 0) - (newUsersLastMonth || 0)) / (newUsersLastMonth || 1)) * 100
      : 0;

  return NextResponse.json({
    mrr_cents: mrr,
    revenue_this_month_cents: revenueThisMonth,
    revenue_last_month_cents: revenueLastMonth,
    total_users: totalUsers || 0,
    active_users_7d: activeUserIds.size,
    new_users_this_month: newUsersThisMonth || 0,
    new_users_last_month: newUsersLastMonth || 0,
    active_subscriptions: totalActive,
    canceled_last_30d: canceledLast30 || 0,
    churn_rate_pct: Math.round(churnRate * 10) / 10,
    growth_pct: Math.round(growthPct * 10) / 10,
    tier_counts: tierCounts,
  });
}
