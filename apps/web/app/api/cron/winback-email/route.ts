import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();

  const { data: canceled } = await admin
    .from('cancellation_attempts')
    .select('id, user_id, reason, plan_tier_at_attempt')
    .eq('final_status', 'canceled')
    .is('winback_sent_at', null)
    .lte('completed_at', sevenDaysAgo)
    .gte('completed_at', eightDaysAgo)
    .limit(100);

  let sent = 0;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  for (const row of (canceled || []) as Record<string, unknown>[]) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', row.user_id as string)
      .maybeSingle();

    const profileRec = profile as Record<string, unknown> | null;
    if (!profileRec?.email || !RESEND_KEY) continue;

    const firstName = String(profileRec.full_name || 'treineiro').split(' ')[0];
    const tierLabel =
      row.plan_tier_at_attempt === 'premium' ? 'Premium' : 'Pro';

    const html = `
      <div style="font-family: system-ui; max-width: 500px; padding: 24px;">
        <h1>Sentimos sua falta, ${firstName}</h1>
        <p>Faz uma semana que você cancelou o MyFitLife ${tierLabel}. Queremos fazer uma oferta final:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>30% de desconto por 3 meses</strong> se voltar agora.</p>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Pro Mensal sai por R$ 20,93 em vez de R$ 29,90.</p>
        </div>
        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://myfitlife.app'}/app/plans?winback=${row.id}" style="background: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voltar com desconto
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          Oferta válida por 72h. Não vamos insistir mais depois disso.
        </p>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyFitLife <team@myfitlife.app>',
        to: profileRec.email,
        subject: `${firstName}, uma última oferta de 30% off`,
        html,
      }),
    }).catch(() => null);

    await admin
      .from('cancellation_attempts')
      .update({ winback_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', row.id as string);

    sent++;
  }

  return NextResponse.json({ sent });
}
