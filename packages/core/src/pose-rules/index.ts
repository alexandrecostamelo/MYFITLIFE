export type Landmark = { x: number; y: number; z: number; visibility?: number };
export type PoseLandmarks = Landmark[];

export type FormFeedback = {
  score: number;
  cues: string[];
  phase?: 'up' | 'down' | 'transition';
};

export type PoseCheckKey = 'squat' | 'push_up' | 'plank' | 'lunge';

export const LM = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
  L_HEEL: 29, R_HEEL: 30,
  L_FOOT: 31, R_FOOT: 32,
};

export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (mag1 === 0 || mag2 === 0) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function avg(a: number, b: number): number {
  return (a + b) / 2;
}

function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: avg(a.x, b.x), y: avg(a.y, b.y), z: avg(a.z, b.z), visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) };
}

export function analyzeSquat(lm: PoseLandmarks): FormFeedback {
  const cues: string[] = [];
  let score = 100;

  const lHip = lm[LM.L_HIP], rHip = lm[LM.R_HIP];
  const lKnee = lm[LM.L_KNEE], rKnee = lm[LM.R_KNEE];
  const lAnkle = lm[LM.L_ANKLE], rAnkle = lm[LM.R_ANKLE];
  const lShoulder = lm[LM.L_SHOULDER], rShoulder = lm[LM.R_SHOULDER];

  const leftKneeAngle = angle(lHip, lKnee, lAnkle);
  const rightKneeAngle = angle(rHip, rKnee, rAnkle);
  const kneeAngle = avg(leftKneeAngle, rightKneeAngle);

  const hipY = avg(lHip.y, rHip.y);
  const kneeY = avg(lKnee.y, rKnee.y);

  let phase: 'up' | 'down' | 'transition' = 'transition';
  if (kneeAngle > 160) phase = 'up';
  else if (kneeAngle < 100) phase = 'down';

  if (phase === 'down') {
    if (hipY < kneeY - 0.03) {
      cues.push('Desça mais — quadril ainda acima do joelho');
      score -= 20;
    }
    const backAngle = angle(
      midpoint(lShoulder, rShoulder),
      midpoint(lHip, rHip),
      midpoint(lKnee, rKnee)
    );
    if (backAngle < 60) {
      cues.push('Mantenha o peito mais aberto');
      score -= 15;
    }
    if (leftKneeAngle < 70 || rightKneeAngle < 70) {
      cues.push('Cuidado — joelhos muito flexionados');
      score -= 10;
    }
  }

  const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle);
  if (kneeDiff > 15) {
    cues.push('Mantenha simetria entre as pernas');
    score -= 10;
  }

  return { score: Math.max(0, score), cues, phase };
}

export function analyzePushUp(lm: PoseLandmarks): FormFeedback {
  const cues: string[] = [];
  let score = 100;

  const lShoulder = lm[LM.L_SHOULDER], rShoulder = lm[LM.R_SHOULDER];
  const lElbow = lm[LM.L_ELBOW], rElbow = lm[LM.R_ELBOW];
  const lWrist = lm[LM.L_WRIST], rWrist = lm[LM.R_WRIST];
  const lHip = lm[LM.L_HIP], rHip = lm[LM.R_HIP];
  const lAnkle = lm[LM.L_ANKLE], rAnkle = lm[LM.R_ANKLE];

  const elbowAngle = avg(
    angle(lShoulder, lElbow, lWrist),
    angle(rShoulder, rElbow, rWrist)
  );

  let phase: 'up' | 'down' | 'transition' = 'transition';
  if (elbowAngle > 155) phase = 'up';
  else if (elbowAngle < 100) phase = 'down';

  const bodyLineAngle = angle(
    midpoint(lShoulder, rShoulder),
    midpoint(lHip, rHip),
    midpoint(lAnkle, rAnkle)
  );

  if (bodyLineAngle < 160) {
    const hipY = avg(lHip.y, rHip.y);
    const shoulderY = avg(lShoulder.y, rShoulder.y);
    if (hipY > shoulderY + 0.05) {
      cues.push('Quadril muito alto — mantenha a linha reta');
    } else {
      cues.push('Quadril caindo — contraia o core');
    }
    score -= 25;
  }

  if (phase === 'down' && elbowAngle > 110) {
    cues.push('Desça mais — cotovelos ainda pouco flexionados');
    score -= 15;
  }

  return { score: Math.max(0, score), cues, phase };
}

export function analyzePlank(lm: PoseLandmarks): FormFeedback {
  const cues: string[] = [];
  let score = 100;

  const lShoulder = lm[LM.L_SHOULDER], rShoulder = lm[LM.R_SHOULDER];
  const lHip = lm[LM.L_HIP], rHip = lm[LM.R_HIP];
  const lAnkle = lm[LM.L_ANKLE], rAnkle = lm[LM.R_ANKLE];

  const bodyLineAngle = angle(
    midpoint(lShoulder, rShoulder),
    midpoint(lHip, rHip),
    midpoint(lAnkle, rAnkle)
  );

  const hipY = avg(lHip.y, rHip.y);
  const shoulderY = avg(lShoulder.y, rShoulder.y);
  const ankleY = avg(lAnkle.y, rAnkle.y);

  if (bodyLineAngle < 170) {
    if (hipY > shoulderY + 0.03 && hipY > ankleY - 0.01) {
      cues.push('Quadril caindo — contraia core e glúteos');
    } else if (hipY < shoulderY - 0.03) {
      cues.push('Quadril muito alto — abaixe pro plano');
    }
    score -= 20;
  }

  return { score: Math.max(0, score), cues, phase: 'transition' };
}

export function analyzeLunge(lm: PoseLandmarks): FormFeedback {
  const cues: string[] = [];
  let score = 100;

  const lHip = lm[LM.L_HIP], rHip = lm[LM.R_HIP];
  const lKnee = lm[LM.L_KNEE], rKnee = lm[LM.R_KNEE];
  const lAnkle = lm[LM.L_ANKLE], rAnkle = lm[LM.R_ANKLE];
  const lShoulder = lm[LM.L_SHOULDER], rShoulder = lm[LM.R_SHOULDER];

  const leftKneeAngle = angle(lHip, lKnee, lAnkle);
  const rightKneeAngle = angle(rHip, rKnee, rAnkle);
  const frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

  let phase: 'up' | 'down' | 'transition' = 'transition';
  if (frontKneeAngle > 160) phase = 'up';
  else if (frontKneeAngle < 110) phase = 'down';

  if (phase === 'down') {
    if (frontKneeAngle < 75) {
      cues.push('Cuidado — joelho da frente passou de 90 graus');
      score -= 15;
    }
    if (frontKneeAngle > 100) {
      cues.push('Desça mais — joelho da frente ainda longe de 90');
      score -= 10;
    }

    const backAngle = angle(
      midpoint(lShoulder, rShoulder),
      midpoint(lHip, rHip),
      midpoint(lKnee, rKnee)
    );
    if (backAngle < 70) {
      cues.push('Mantenha o tronco mais ereto');
      score -= 15;
    }
  }

  return { score: Math.max(0, score), cues, phase };
}

export function analyzePose(key: PoseCheckKey, lm: PoseLandmarks): FormFeedback {
  switch (key) {
    case 'squat': return analyzeSquat(lm);
    case 'push_up': return analyzePushUp(lm);
    case 'plank': return analyzePlank(lm);
    case 'lunge': return analyzeLunge(lm);
    default: return { score: 100, cues: [] };
  }
}

export const EXERCISE_LABELS: Record<PoseCheckKey, string> = {
  squat: 'Agachamento',
  push_up: 'Flexão de braço',
  plank: 'Prancha',
  lunge: 'Avanço (lunge)',
};

export function countRep(currentPhase: string, lastPhase: string): boolean {
  return lastPhase === 'down' && currentPhase === 'up';
}
