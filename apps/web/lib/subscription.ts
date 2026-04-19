export type Plan = 'free' | 'pro' | 'elite';

export type AccessContext = {
  plan: Plan;
  userId: string;
};

type FeatureKey =
  | 'ai_coach'
  | 'ai_coach_stream'
  | 'lab_upload'
  | 'cycle_tracking'
  | 'biomarkers'
  | 'guided_trails'
  | 'community'
  | 'proactive_coach'
  | 'progress_photos'
  | 'advanced_gamification';

const PLAN_FEATURES: Record<Plan, Set<FeatureKey>> = {
  free: new Set<FeatureKey>([
    'ai_coach',
    'community',
    'guided_trails',
  ]),
  pro: new Set<FeatureKey>([
    'ai_coach',
    'ai_coach_stream',
    'lab_upload',
    'cycle_tracking',
    'biomarkers',
    'guided_trails',
    'community',
    'proactive_coach',
    'progress_photos',
    'advanced_gamification',
  ]),
  elite: new Set<FeatureKey>([
    'ai_coach',
    'ai_coach_stream',
    'lab_upload',
    'cycle_tracking',
    'biomarkers',
    'guided_trails',
    'community',
    'proactive_coach',
    'progress_photos',
    'advanced_gamification',
  ]),
};

const PLAN_LIMITS: Record<Plan, Record<string, number>> = {
  free: {
    ai_messages_per_day: 5,
    lab_uploads_per_day: 0,
    progress_photos_per_month: 0,
  },
  pro: {
    ai_messages_per_day: 30,
    lab_uploads_per_day: 5,
    progress_photos_per_month: 30,
  },
  elite: {
    ai_messages_per_day: 100,
    lab_uploads_per_day: 20,
    progress_photos_per_month: 100,
  },
};

export function requiresFeature(ctx: AccessContext, feature: FeatureKey): boolean {
  return PLAN_FEATURES[ctx.plan]?.has(feature) ?? false;
}

export function getFeatureLimit(ctx: AccessContext, limitKey: string): number {
  return PLAN_LIMITS[ctx.plan]?.[limitKey] ?? 0;
}

export function getPlanLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    free: 'Gratuito',
    pro: 'Pro',
    elite: 'Elite',
  };
  return labels[plan];
}
