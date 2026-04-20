import { createClient as createAdmin } from '@supabase/supabase-js';
import { createPagarMePixCharge, getPagarMeChargeStatus } from '@/lib/pagarme';
import { requestSubscriptionNfse } from '@/lib/nfse/subscription-issuer';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const PRICES: Record<string, number> = {
  monthly: 2990,
  yearly: 24990,
};

const GRACE_PERIOD_DAYS = 3;

export async function findSubsNeedingRenewal() {
  const supa = admin();
  const fiveDays = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();

  const { data: subs } = await supa
    .from('subscriptions')
    .select('id, user_id, plan, billing_cycle, current_period_end, pagarme_customer_id, renewal_reminders_sent')
    .eq('payment_method', 'pix')
    .in('status', ['active', 'past_due'])
    .lte('current_period_end', fiveDays);

  return subs || [];
}

export async function generateRenewalCharge(
  subId: string,
): Promise<{ ok: boolean; charge_id?: string; reason?: string }> {
  const supa = admin();

  const { data: sub } = await supa
    .from('subscriptions')
    .select('id, user_id, plan, billing_cycle, current_period_end')
    .eq('id', subId)
    .maybeSingle();

  if (!sub) return { ok: false, reason: 'sub_not_found' };

  // Skip if a valid pending charge already exists
  const { data: existing } = await supa
    .from('pix_charges')
    .select('id')
    .eq('subscription_id', subId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) return { ok: true, charge_id: existing.id, reason: 'already_pending' };

  const cycle = String(sub.billing_cycle || 'monthly');
  const amount = PRICES[cycle] || PRICES.monthly;

  // Get user profile for customer data
  const { data: profile } = await supa
    .from('profiles')
    .select('full_name, email')
    .eq('id', sub.user_id)
    .maybeSingle();

  // Get fiscal info if available
  const { data: fiscal } = await supa
    .from('user_fiscal_info')
    .select('document, document_type, name')
    .eq('user_id', sub.user_id)
    .maybeSingle();

  const customerName = (fiscal as Record<string, unknown> | null)?.name as string
    || (profile as Record<string, unknown> | null)?.full_name as string
    || 'Assinante MyFitLife';
  const customerEmail = (profile as Record<string, unknown> | null)?.email as string
    || 'noemail@myfitlife.app';
  const customerDoc = (fiscal as Record<string, unknown> | null)?.document as string || '00000000000';
  const customerDocType = ((fiscal as Record<string, unknown> | null)?.document_type as string || 'CPF') as 'CPF' | 'CNPJ';

  try {
    const pixResult = await createPagarMePixCharge({
      amountCents: amount,
      customer: {
        name: customerName,
        email: customerEmail,
        document: customerDoc,
        document_type: customerDocType,
      },
      expiresInSeconds: 7 * 24 * 3600,
      description: `Renovação MyFitLife Pro ${cycle === 'yearly' ? 'Anual' : 'Mensal'}`,
      metadata: { subscription_id: subId, purpose: 'renewal' },
    });

    const { data: charge } = await supa
      .from('pix_charges')
      .insert({
        user_id: sub.user_id,
        subscription_id: subId,
        pagarme_charge_id: pixResult.charge_id,
        pagarme_order_id: pixResult.order_id,
        amount_cents: amount,
        status: 'pending',
        qr_code: pixResult.qr_code,
        qr_code_url: pixResult.qr_code_url,
        expires_at: pixResult.expires_at || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        purpose: 'renewal',
      } as Record<string, unknown>)
      .select('id')
      .single();

    return { ok: true, charge_id: charge?.id };
  } catch (err: any) {
    console.error('generateRenewalCharge failed:', err);
    return { ok: false, reason: err.message };
  }
}

export async function checkPendingCharges(): Promise<{ checked: number; paid: number }> {
  const supa = admin();

  const { data: pending } = await supa
    .from('pix_charges')
    .select('id, user_id, subscription_id, pagarme_charge_id, amount_cents, expires_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);

  let checked = 0;
  let paid = 0;

  for (const charge of pending || []) {
    checked++;
    const chargeId = (charge as Record<string, unknown>).pagarme_charge_id as string | null;
    if (!chargeId) continue;

    try {
      const remote = await getPagarMeChargeStatus(chargeId);

      if (remote.status === 'paid') {
        await supa
          .from('pix_charges')
          .update({
            status: 'paid',
            paid_at: remote.paid_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', charge.id);

        const subId = (charge as Record<string, unknown>).subscription_id as string | null;
        if (subId) {
          await extendSubscription(subId, charge.user_id);

          // Trigger NFSe for Pix renewal payment
          requestSubscriptionNfse({
            user_id: charge.user_id,
            subscription_id: subId,
            amount_cents: charge.amount_cents,
            source_type: 'pix',
            source_id: charge.id,
            description: `MyFitLife Pro - renovação Pix`,
          }).catch(() => null);
        }
        paid++;
      } else if (new Date(charge.expires_at) < new Date()) {
        await supa
          .from('pix_charges')
          .update({ status: 'expired', updated_at: new Date().toISOString() } as Record<string, unknown>)
          .eq('id', charge.id);
      }
    } catch (err) {
      console.error('checkPendingCharge failed for', charge.id, err);
    }
  }

  return { checked, paid };
}

async function extendSubscription(subId: string, userId: string) {
  const supa = admin();

  const { data: sub } = await supa
    .from('subscriptions')
    .select('plan, billing_cycle, current_period_end')
    .eq('id', subId)
    .maybeSingle();

  if (!sub) return;

  const cycle = String((sub as Record<string, unknown>).billing_cycle || 'monthly');
  const days = cycle === 'yearly' ? 365 : 30;
  const currentEnd = (sub as Record<string, unknown>).current_period_end as string | null;
  const base = currentEnd && new Date(currentEnd) > new Date()
    ? new Date(currentEnd)
    : new Date();
  const newEnd = new Date(base.getTime() + days * 24 * 3600 * 1000);

  await supa
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: newEnd.toISOString(),
      grace_period_end: null,
      renewal_reminders_sent: 0,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', subId);

  const tier = String((sub as Record<string, unknown>).plan || 'pro');
  await supa
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
    } as Record<string, unknown>)
    .eq('id', userId);
}

export async function expireOverdueSubscriptions(): Promise<{ expired: number; graced: number }> {
  const supa = admin();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: overdue } = await supa
    .from('subscriptions')
    .select('id, user_id, current_period_end, grace_period_end')
    .eq('payment_method', 'pix')
    .in('status', ['active', 'past_due'])
    .lte('current_period_end', nowIso);

  let expired = 0;
  let graced = 0;

  for (const sub of overdue || []) {
    const rec = sub as Record<string, unknown>;
    const currentEnd = new Date(rec.current_period_end as string);
    const graceEnd = rec.grace_period_end
      ? new Date(rec.grace_period_end as string)
      : new Date(currentEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000);

    // First time past due: set grace period
    if (!rec.grace_period_end) {
      await supa
        .from('subscriptions')
        .update({
          status: 'past_due',
          grace_period_end: graceEnd.toISOString(),
          updated_at: nowIso,
        } as Record<string, unknown>)
        .eq('id', rec.id as string);
      graced++;
      continue;
    }

    // Past grace period: cancel
    if (now > graceEnd) {
      await supa
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: nowIso,
        } as Record<string, unknown>)
        .eq('id', rec.id as string);

      await supa
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
        } as Record<string, unknown>)
        .eq('id', rec.user_id as string);

      expired++;
    }
  }

  return { expired, graced };
}
