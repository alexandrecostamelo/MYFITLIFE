import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 30;
  const gateway = searchParams.get('gateway') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const format = searchParams.get('format') || 'json';

  let query = admin
    .from('payment_transactions')
    .select('*, profiles!user_id(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (gateway) query = query.eq('gateway', gateway);
  if (status) query = query.eq('status', status);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

  if (format === 'csv') {
    query = query.limit(5000);
    const { data } = await query;
    const rows = (data || []).map((t: any) => {
      const profArr = t.profiles as { full_name: string; email: string }[] | { full_name: string; email: string } | null;
      const prof = Array.isArray(profArr) ? profArr[0] : profArr;
      return [
        t.created_at,
        prof?.full_name || '',
        prof?.email || '',
        t.gateway || '',
        t.amount || t.amount_cents || 0,
        t.status || '',
        t.external_id || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = `Data,Nome,Email,Gateway,Valor,Status,ID Externo\n${rows.join('\n')}`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transacoes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  query = query.range((page - 1) * perPage, page * perPage - 1);
  const { data, count } = await query;

  return NextResponse.json({
    transactions: data || [],
    total: count || 0,
    page,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}
