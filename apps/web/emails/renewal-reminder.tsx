import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailCard,
} from './components/layout';

interface Props {
  name: string;
  daysUntil: number;
  amount: string;
  qrCode?: string;
}

export function RenewalReminderEmail({
  name,
  daysUntil,
  amount,
  qrCode,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  const urgency =
    daysUntil <= 1
      ? '\u26A0\uFE0F \u00DAltimo dia'
      : daysUntil <= 3
        ? '\u23F0 Em breve'
        : '\u{1F4C5} Lembrete';
  return (
    <EmailLayout
      preview={`${urgency}: sua assinatura vence em ${daysUntil} dia(s)`}
    >
      <EmailHeading>{urgency}</EmailHeading>
      <EmailText>
        Oi {firstName}, sua assinatura Pro vence em {daysUntil} dia
        {daysUntil !== 1 ? 's' : ''}. Renove por {amount} pra continuar
        com acesso completo.
      </EmailText>
      {qrCode && (
        <EmailCard>
          <EmailText muted>Pix copia e cola:</EmailText>
          <EmailText>{qrCode.slice(0, 80)}...</EmailText>
        </EmailCard>
      )}
      <EmailButton href="https://myfitlife.app/app/billing">
        Renovar agora
      </EmailButton>
      <EmailText muted>
        N\u00e3o quer se preocupar com renova\u00e7\u00e3o? Troque pra
        cart\u00e3o em /app/billing.
      </EmailText>
    </EmailLayout>
  );
}

export default RenewalReminderEmail;
