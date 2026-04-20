import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailCard,
  BRAND,
} from './components/layout';

interface Props {
  name: string;
  plan: string;
  amount: string;
  nextBilling: string;
}

export function PaymentConfirmedEmail({
  name,
  plan,
  amount,
  nextBilling,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  return (
    <EmailLayout preview={`Pagamento confirmado \u2014 ${plan}`}>
      <EmailHeading>Pagamento confirmado \u2713</EmailHeading>
      <EmailText>
        Oi {firstName}, recebemos seu pagamento.
      </EmailText>
      <EmailCard>
        <EmailText muted>
          Plano: {plan}
          {'\n'}
          Valor: {amount}
          {'\n'}
          Pr\u00f3xima cobran\u00e7a: {nextBilling}
        </EmailText>
      </EmailCard>
      <EmailButton href={`${BRAND.url}/app/billing`}>
        Ver assinatura
      </EmailButton>
    </EmailLayout>
  );
}

export default PaymentConfirmedEmail;
