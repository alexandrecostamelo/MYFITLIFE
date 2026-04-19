import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('id, provider, amount_cents, currency, status, method, description, billing_cycle, paid_at, failed_at, receipt_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ transactions: transactions || [] });
}
