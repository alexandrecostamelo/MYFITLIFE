import { createClient as createAdmin } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';
import { sendEmail } from '@/lib/email/render';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

type UrgencyLevel = 'soft' | 'moderate' | 'urgent' | 'final';

function daysUntil(date: string | Date): number {
  const target = new Date(date).getTime();
  return Math.ceil((target - Date.now()) / (24 * 3600 * 1000));
}

function urgencyFromDays(days: number): UrgencyLevel {
  if (days <= 1) return 'final';
  if (days <= 2) return 'urgent';
  if (days <= 3) return 'moderate';
  return 'soft';
}

const MESSAGES: Record<UrgencyLevel, { title: string; body: string }> = {
  soft: {
    title: 'Sua assinatura vence em breve',
    body: 'Renove via Pix pra continuar aproveitando o Pro sem interrupção.',
  },
  moderate: {
    title: 'Renovação em 3 dias',
    body: 'O Pix de renovação já está disponível. Pague hoje pra evitar interrupção.',
  },
  urgent: {
    title: 'Sua assinatura vence em 2 dias',
    body: 'Renove agora via Pix ou mude pra cartão pra nunca mais se preocupar.',
  },
  final: {
    title: 'Último dia pra renovar',
    body: 'Se não renovar hoje, você perde acesso ao Pro amanhã. Pague o Pix em 30s.',
  },
};

// How many total notifications should have been sent by each urgency level
const TARGET_COUNT: Record<UrgencyLevel, number> = {
  soft: 1,
  moderate: 2,
  urgent: 3,
  final: 4,
};

export async function sendRenewalNotifications(): Promise<{ sent: number; skipped: number }> {
  const supa = admin();
  const sevenDays = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const { data: subs } = await supa
    .from('subscriptions')
    .select('id, user_id, current_period_end, renewal_reminders_sent')
    .eq('payment_method', 'pix')
    .in('status', ['active', 'past_due'])
    .lte('current_period_end', sevenDays);

  let sent = 0;
  let skipped = 0;

  for (const sub of subs || []) {
    const rec = sub as Record<string, unknown>;
    const periodEnd = rec.current_period_end as string;
    if (!periodEnd) { skipped++; continue; }

    const days = daysUntil(periodEnd);
    if (days > 7) { skipped++; continue; }

    const urgency = urgencyFromDays(days);
    const targetCount = TARGET_COUNT[urgency];
    const alreadySent = (rec.renewal_reminders_sent as number) || 0;

    if (alreadySent >= targetCount) {
      skipped++;
      continue;
    }

    const msg = MESSAGES[urgency];

    try {
      // Send push notification
      await sendPushToUser(supa, rec.user_id as string, {
        title: msg.title,
        body: msg.body,
        url: '/app/billing',
        tag: 'renewal',
      }).catch(() => null);

      // Send email reminder
      await sendRenewalEmail(rec.user_id as string, urgency, days).catch(() => null);

      await supa
        .from('subscriptions')
        .update({
          renewal_reminders_sent: alreadySent + 1,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', rec.id as string);

      sent++;
    } catch {
      skipped++;
    }
  }

  return { sent, skipped };
}

async function sendRenewalEmail(userId: string, urgency: UrgencyLevel, daysUntilExpiry: number) {
  if (!process.env.RESEND_API_KEY) return;

  const supa = admin();
  const { data: profile } = await supa
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle();

  const email = (profile as Record<string, unknown> | null)?.email as string | null;
  if (!email) return;

  const name = String((profile as Record<string, unknown> | null)?.full_name || '');

  const { data: charge } = await supa
    .from('pix_charges')
    .select('qr_code, amount_cents')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const chargeRec = charge as Record<string, unknown> | null;
  const qrCode = chargeRec?.qr_code as string | null;
  const amountCents = (chargeRec?.amount_cents as number) || 2990;

  const subject =
    urgency === 'final'
      ? 'Último dia para renovar seu MyFitLife Pro'
      : urgency === 'urgent'
        ? `MyFitLife vence em ${daysUntilExpiry} dias`
        : 'Renove seu MyFitLife Pro';

  await sendEmail({
    to: email,
    template: 'renewal-reminder',
    props: {
      name,
      daysUntil: daysUntilExpiry,
      urgency,
      qrCode,
      amountCents,
    },
    subject,
  });
}
