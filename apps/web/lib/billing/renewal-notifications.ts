import { createClient as createAdmin } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';

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
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const supa = admin();
  const { data: profile } = await supa
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle();

  const email = (profile as Record<string, unknown> | null)?.email as string | null;
  if (!email) return;

  const name = String((profile as Record<string, unknown> | null)?.full_name || '').split(' ')[0] || 'treineiro';

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

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #111;">Oi ${name}!</h1>
      <p>Sua assinatura Pro vence em <strong>${daysUntilExpiry} dia${daysUntilExpiry !== 1 ? 's' : ''}</strong>.</p>
      ${qrCode ? `
        <p>Pague R$ ${(amountCents / 100).toFixed(2).replace('.', ',')} via Pix pra renovar:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 12px;">
          ${qrCode}
        </div>
      ` : '<p>Entre no app pra gerar seu QR Pix de renovação.</p>'}
      <p style="margin-top: 16px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://myfitlife.app'}/app/billing"
           style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver no app
        </a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Não quer se preocupar com renovação? Troque pra cartão em /app/billing.
      </p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MyFitLife <noreply@myfitlife.app>',
      to: email,
      subject,
      html,
    }),
  });
}
