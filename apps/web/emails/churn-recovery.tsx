import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
} from './components/layout';

interface Props {
  name: string;
  daysSinceLastLogin: number;
  streak: number;
}

export function ChurnRecoveryEmail({
  name,
  daysSinceLastLogin,
  streak,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  return (
    <EmailLayout
      preview={`${firstName}, sentimos sua falta no MyFitLife`}
    >
      <EmailHeading>Oi, {firstName} {'\u{1F440}'}</EmailHeading>
      <EmailText>
        Faz {daysSinceLastLogin} dias que voc\u00ea n\u00e3o aparece.{' '}
        {streak > 0
          ? `Seu streak de ${streak} dias est\u00e1 em risco!`
          : 'Que tal voltar hoje?'}
      </EmailText>
      <EmailText muted>
        Seu coach preparou um plano especial pra voc\u00ea voltar sem
        press\u00e3o. 5 minutos \u00e9 suficiente pra manter o h\u00e1bito.
      </EmailText>
      <EmailButton href="https://myfitlife.app/app/workouts/explore">
        Treino r\u00e1pido de 5 min
      </EmailButton>
      <EmailText muted>
        Se n\u00e3o quiser mais receber, ajuste nas configura\u00e7\u00f5es do
        app.
      </EmailText>
    </EmailLayout>
  );
}

export default ChurnRecoveryEmail;
