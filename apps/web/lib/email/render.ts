import { render } from '@react-email/render';
import { createElement } from 'react';

import { WelcomeEmail } from '@/emails/welcome';
import { WeeklySummaryEmail } from '@/emails/weekly-summary';
import { ChurnRecoveryEmail } from '@/emails/churn-recovery';
import { RenewalReminderEmail } from '@/emails/renewal-reminder';
import { PaymentConfirmedEmail } from '@/emails/payment-confirmed';
import { NfseIssuedEmail } from '@/emails/nfse-issued';
import { WinBackEmail } from '@/emails/win-back';
import { WorkoutStreakEmail } from '@/emails/workout-streak';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATES: Record<string, React.ComponentType<any>> = {
  welcome: WelcomeEmail,
  'weekly-summary': WeeklySummaryEmail,
  'churn-recovery': ChurnRecoveryEmail,
  'renewal-reminder': RenewalReminderEmail,
  'payment-confirmed': PaymentConfirmedEmail,
  'nfse-issued': NfseIssuedEmail,
  'win-back': WinBackEmail,
  'workout-streak': WorkoutStreakEmail,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SUBJECTS: Record<string, (p: any) => string> = {
  welcome: (p) =>
    `Bem-vindo ao MyFitLife, ${p.name?.split(' ')[0] || 'Treineiro'}!`,
  'weekly-summary': () => 'Seu resumo semanal MyFitLife',
  'churn-recovery': (p) =>
    `${p.name?.split(' ')[0] || 'Treineiro'}, sentimos sua falta!`,
  'renewal-reminder': (p) =>
    `Sua assinatura vence em ${p.daysUntil} dia${p.daysUntil !== 1 ? 's' : ''}`,
  'payment-confirmed': (p) => `Pagamento confirmado — ${p.plan}`,
  'nfse-issued': (p) => `Nota fiscal ${p.nfseNumber} emitida`,
  'win-back': (p) =>
    `${p.name?.split(' ')[0] || 'Treineiro'}, ${p.discountPct || 30}% off por ${p.discountMonths || 3} meses`,
  'workout-streak': (p) =>
    `${p.streak} dias de streak! Continue assim`,
};

export async function renderEmail(
  template: string,
  props: Record<string, unknown>,
): Promise<{ html: string; subject: string }> {
  const Component = TEMPLATES[template];
  if (!Component) throw new Error(`Template "${template}" não encontrado`);

  const element = createElement(Component, props);
  const html = await render(element);
  const subjectFn = SUBJECTS[template];
  const subject = subjectFn ? subjectFn(props) : 'MyFitLife';

  return { html, subject };
}

export async function sendEmail(opts: {
  to: string;
  template: string;
  props: Record<string, unknown>;
  subject?: string;
}) {
  const { to, template, props, subject: overrideSubject } = opts;
  const { html, subject } = await renderEmail(template, props);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MyFitLife <noreply@myfitlife.app>',
      to,
      subject: overrideSubject || subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}
