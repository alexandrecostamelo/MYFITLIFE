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
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 30;
  const offset = (page - 1) * perPage;
  const statusFilter = searchParams.get('status') || '';
  const format = searchParams.get('format') || 'json';

  let query = admin
    .from('subscriptions')
    .select(
      'id, user_id, plan, billing_cycle, status, provider, payment_method, next_billing_at, created_at, updated_at, card_brand, card_last4, paused_until',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (format === 'csv') {
    query = query.limit(10000);
    const { data: allSubs } = await query;
    const rows = (allSubs || []) as Record<string, unknown>[];
    const csv = [
      'id,user_id,plano,ciclo,status,provider,metodo,proximo_billing,criado_em',
      ...rows.map((s) =>
        [s.id, s.user_id, s.plan, s.billing_cycle, s.status, s.provider, s.payment_method, s.next_billing_at, s.created_at]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscriptions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  query = query.range(offset, offset + perPage - 1);
  const { data: subs, count } = await query;

  // Get user names for the subscriptions
  const userIds = [...new Set((subs || []).map((s: any) => s.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const enriched = (subs || []).map((s: any) => ({
    ...s,
    user_name: profileMap.get(s.user_id)?.full_name || null,
    user_email: profileMap.get(s.user_id)?.email || null,
  }));

  return NextResponse.json({
    subscriptions: enriched,
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}
