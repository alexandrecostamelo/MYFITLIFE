import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailMetric,
  EmailCard,
} from './components/layout';
import { Section, Column, Row } from '@react-email/components';

interface Props {
  name: string;
  streak: number;
  workouts: number;
  minutes: number;
  calories: number;
  mealsLogged: number;
  readinessAvg: number | null;
  topAchievement: string | null;
}

export function WeeklySummaryEmail({
  name,
  streak,
  workouts,
  minutes,
  calories,
  mealsLogged,
  readinessAvg,
  topAchievement,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Treineiro';
  return (
    <EmailLayout
      preview={`Sua semana: ${workouts} treinos, ${streak} dias de streak`}
    >
      <EmailHeading>Sua semana, {firstName} {'\u{1F4AA}'}</EmailHeading>
      <Row>
        <Column style={{ textAlign: 'center', width: '33%' }}>
          <EmailMetric label="Treinos" value={workouts} />
        </Column>
        <Column style={{ textAlign: 'center', width: '33%' }}>
          <EmailMetric label="Minutos" value={minutes} />
        </Column>
        <Column style={{ textAlign: 'center', width: '33%' }}>
          <EmailMetric label="Streak" value={streak} />
        </Column>
      </Row>
      <EmailCard>
        <EmailText muted>
          {'\u{1F525}'} {calories} kcal queimadas {'\u00b7'} {'\u{1F957}'}{' '}
          {mealsLogged} refei\u00e7\u00f5es registradas
          {readinessAvg !== null &&
            ` \u00b7 \u{1F49A} Readiness m\u00e9dio ${readinessAvg}/100`}
        </EmailText>
        {topAchievement && (
          <EmailText>
            {'\u{1F3C6}'} Conquista da semana: {topAchievement}
          </EmailText>
        )}
      </EmailCard>
      <EmailButton href="https://myfitlife.app/app/dashboard">
        Ver detalhes
      </EmailButton>
    </EmailLayout>
  );
}

export default WeeklySummaryEmail;
