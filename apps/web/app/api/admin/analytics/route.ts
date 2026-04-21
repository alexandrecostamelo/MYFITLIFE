import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString();

  // Daily signups (30 days)
  const { data: dailySignups } = await admin
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  const signupsByDay: Record<string, number> = {};
  for (const row of dailySignups || []) {
    const day = new Date(row.created_at as string).toISOString().slice(0, 10);
    signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  }

  // Daily active users (from ai_usage_log as proxy)
  const { data: dailyActive } = await admin
    .from('ai_usage_log')
    .select('user_id, created_at')
    .gte('created_at', thirtyDaysAgo);

  const dauByDay: Record<string, Set<string>> = {};
  for (const row of dailyActive || []) {
    const day = new Date(row.created_at as string).toISOString().slice(0, 10);
    if (!dauByDay[day]) dauByDay[day] = new Set();
    dauByDay[day].add(row.user_id as string);
  }

  // Build daily metrics array
  const dailyMetrics = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const day = d.toISOString().slice(0, 10);
    dailyMetrics.push({
      day,
      signups: signupsByDay[day] || 0,
      active_users: dauByDay[day]?.size || 0,
    });
  }

  // Cohort retention (last 3 months)
  // Get users by signup month
  const { data: allUsers } = await admin
    .from('profiles')
    .select('id, created_at')
    .gte('created_at', ninetyDaysAgo);

  const { data: allActivity } = await admin
    .from('ai_usage_log')
    .select('user_id, created_at')
    .gte('created_at', ninetyDaysAgo);

  const activityByUser: Record<string, Set<string>> = {};
  for (const row of allActivity || []) {
    const uid = row.user_id as string;
    if (!activityByUser[uid]) activityByUser[uid] = new Set();
    activityByUser[uid].add(new Date(row.created_at as string).toISOString().slice(0, 10));
  }

  const cohortMap: Record<string, { users: { id: string; created: string }[] }> = {};
  for (const u of allUsers || []) {
    const month = new Date(u.created_at as string).toISOString().slice(0, 7);
    if (!cohortMap[month]) cohortMap[month] = { users: [] };
    cohortMap[month].users.push({ id: u.id as string, created: u.created_at as string });
  }

  const cohorts = Object.entries(cohortMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
    .map(([month, { users }]) => {
      let d1 = 0, d7 = 0, d30 = 0;
      for (const u of users) {
        const created = new Date(u.created);
        const days = activityByUser[u.id];
        if (!days) continue;
        const d1Date = new Date(created.getTime() + 86400000).toISOString().slice(0, 10);
        const d7Date = new Date(created.getTime() + 7 * 86400000).toISOString().slice(0, 10);
        const d30Date = new Date(created.getTime() + 30 * 86400000).toISOString().slice(0, 10);
        if (days.has(d1Date)) d1++;
        if (days.has(d7Date)) d7++;
        if (days.has(d30Date)) d30++;
      }
      const size = users.length;
      return {
        month,
        size,
        d1, d7, d30,
        d1_pct: size > 0 ? Math.round((d1 / size) * 100 * 10) / 10 : 0,
        d7_pct: size > 0 ? Math.round((d7 / size) * 100 * 10) / 10 : 0,
        d30_pct: size > 0 ? Math.round((d30 / size) * 100 * 10) / 10 : 0,
      };
    });

  // LTV by tier
  const { data: subData } = await admin
    .from('subscriptions')
    .select('user_id, tier, created_at, canceled_at, status')
    .neq('tier', 'free');

  const { data: payments } = await admin
    .from('payment_transactions')
    .select('user_id, amount_cents, status')
    .eq('status', 'paid');

  const paymentsByUser: Record<string, number> = {};
  for (const p of payments || []) {
    const uid = p.user_id as string;
    paymentsByUser[uid] = (paymentsByUser[uid] || 0) + Number(p.amount_cents || 0);
  }

  const ltvByTier: Record<string, { revenue: number; days: number[]; count: number }> = {};
  for (const s of subData || []) {
    const tier = s.tier as string;
    if (!ltvByTier[tier]) ltvByTier[tier] = { revenue: 0, days: [], count: 0 };
    const uid = s.user_id as string;
    ltvByTier[tier].revenue += paymentsByUser[uid] || 0;
    ltvByTier[tier].count++;
    const start = new Date(s.created_at as string);
    const end = s.canceled_at ? new Date(s.canceled_at as string) : new Date();
    ltvByTier[tier].days.push(Math.round((end.getTime() - start.getTime()) / 86400000));
  }

  const ltv = Object.entries(ltvByTier).map(([tier, data]) => ({
    tier,
    avg_ltv_cents: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    avg_lifetime_days: data.days.length > 0 ? Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length) : 0,
    total_revenue_cents: data.revenue,
    total_users: data.count,
  }));

  // Top AI features (7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { data: aiFeatures } = await admin
    .from('ai_usage_log')
    .select('feature')
    .gte('created_at', sevenDaysAgo)
    .limit(2000);

  const featureCounts: Record<string, number> = {};
  for (const row of aiFeatures || []) {
    const f = String((row as any).feature || 'unknown');
    featureCounts[f] = (featureCounts[f] || 0) + 1;
  }

  const topFeatures = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return NextResponse.json({
    daily: dailyMetrics,
    cohorts,
    ltv,
    top_features: topFeatures,
  });
}
