import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
} from './components/layout';

interface Props {
  name: string;
  trialDays?: number;
}

export function WelcomeEmail({ name, trialDays = 7 }: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  return (
    <EmailLayout preview={`Bem-vindo ao MyFitLife, ${firstName}!`}>
      <EmailHeading>Oi, {firstName}! {'\u{1F44B}'}</EmailHeading>
      <EmailText>
        Sua jornada fitness com IA come\u00e7a agora. Voc\u00ea tem{' '}
        {trialDays} dias de acesso Pro gratuito pra explorar tudo.
      </EmailText>
      <EmailText muted>O que fazer primeiro:</EmailText>
      <EmailText>
        1. Fa\u00e7a o check-in matinal (sono, energia, humor)
        {'\n'}
        2. Deixe o Autopilot gerar seu treino e card\u00e1pio do dia
        {'\n'}
        3. Tire foto de uma refei\u00e7\u00e3o pra IA identificar
        {'\n'}
        4. Converse com seu coach (Leo, Sofia ou Rafa)
      </EmailText>
      <EmailButton href="https://myfitlife.app/app/dashboard">
        Abrir MyFitLife
      </EmailButton>
      <EmailText muted>
        Qualquer d\u00favida, seu coach de IA est\u00e1 dispon\u00edvel 24h.
      </EmailText>
    </EmailLayout>
  );
}

export default WelcomeEmail;
