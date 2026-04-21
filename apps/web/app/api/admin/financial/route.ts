import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');
  const format = searchParams.get('format') || 'json';
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  // All transactions in period
  const { data: transactions } = await admin
    .from('payment_transactions')
    .select('id, user_id, provider, amount_cents, currency, status, method, description, plan_key, billing_cycle, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (format === 'csv') {
    const rows = (transactions || []) as Record<string, unknown>[];
    const csv = [
      'id,user_id,provider,valor_centavos,moeda,status,metodo,descricao,plano,ciclo,criado_em',
      ...rows.map((t) =>
        [t.id, t.user_id, t.provider, t.amount_cents, t.currency, t.status, t.method, t.description, t.plan_key, t.billing_cycle, t.created_at]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const txns = (transactions || []) as Record<string, unknown>[];

  // Aggregate
  let totalPaid = 0;
  let totalFailed = 0;
  let totalPending = 0;
  const byMethod: Record<string, number> = {};
  const byPlan: Record<string, number> = {};

  for (const t of txns) {
    const amt = Number(t.amount_cents) || 0;
    if (t.status === 'paid') {
      totalPaid += amt;
      const method = String(t.method || 'unknown');
      byMethod[method] = (byMethod[method] || 0) + amt;
      const plan = String(t.plan_key || 'unknown');
      byPlan[plan] = (byPlan[plan] || 0) + amt;
    } else if (t.status === 'failed') {
      totalFailed += amt;
    } else {
      totalPending += amt;
    }
  }

  // Active subs for ARPU/LTV
  const { count: activeSubs } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'trialing']);

  const arpu = (activeSubs || 0) > 0 ? Math.round(totalPaid / (activeSubs || 1)) : 0;

  return NextResponse.json({
    period_days: days,
    total_paid_cents: totalPaid,
    total_failed_cents: totalFailed,
    total_pending_cents: totalPending,
    transaction_count: txns.length,
    active_subscribers: activeSubs || 0,
    arpu_cents: arpu,
    by_method: byMethod,
    by_plan: byPlan,
    recent_transactions: txns.slice(0, 50),
  });
}
