import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailCard,
} from './components/layout';

interface Props {
  name: string;
  discountPct?: number;
  discountMonths?: number;
  attemptId: string;
}

export function WinBackEmail({
  name,
  discountPct = 30,
  discountMonths = 3,
  attemptId,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  const discountedPrice = (29.9 * (1 - discountPct / 100)).toFixed(2);
  return (
    <EmailLayout
      preview={`${firstName}, ${discountPct}% off por ${discountMonths} meses`}
    >
      <EmailHeading>
        Uma \u00faltima oferta, {firstName}
      </EmailHeading>
      <EmailText>
        Faz uma semana que voc\u00ea cancelou. Sentimos sua falta. Oferta
        final:
      </EmailText>
      <EmailCard>
        <EmailText>
          {'\u{1F381}'} {discountPct}% de desconto por {discountMonths} meses
          {'\n'}
          Pro Mensal sai por R$ {discountedPrice} em vez de R$ 29,90.
        </EmailText>
      </EmailCard>
      <EmailButton
        href={`https://myfitlife.app/app/plans?winback=${attemptId}`}
      >
        Voltar com desconto
      </EmailButton>
      <EmailText muted>
        Oferta v\u00e1lida por 72h. N\u00e3o vamos insistir depois disso.
      </EmailText>
    </EmailLayout>
  );
}

export default WinBackEmail;
