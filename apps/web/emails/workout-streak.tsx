import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailMetric,
  BRAND,
} from './components/layout';

interface Props {
  name: string;
  streak: number;
  milestone?: boolean;
}

export function WorkoutStreakEmail({
  name,
  streak,
  milestone,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  const emoji =
    streak >= 30
      ? '\u{1F525}\u{1F525}\u{1F525}'
      : streak >= 14
        ? '\u{1F525}\u{1F525}'
        : '\u{1F525}';
  return (
    <EmailLayout preview={`${emoji} ${streak} dias de streak!`}>
      <EmailHeading>
        {milestone ? `${emoji} Milestone!` : `${emoji} Streak!`}
      </EmailHeading>
      <EmailMetric label="Dias seguidos" value={streak} />
      <EmailText>
        {milestone
          ? `Incr\u00edvel, ${firstName}! Voc\u00ea atingiu ${streak} dias consecutivos. Poucos chegam aqui.`
          : `Boa, ${firstName}! ${streak} dias sem parar. Continue assim!`}
      </EmailText>
      <EmailButton href={`${BRAND.url}/app/dashboard`}>
        Manter o streak
      </EmailButton>
    </EmailLayout>
  );
}

export default WorkoutStreakEmail;
