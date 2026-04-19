export type Tier = 'free' | 'pro' | 'premium';
export type RateLimitedEndpoint =
  | 'coach_chat'
  | 'recognize_food'
  | 'recognize_equipment'
  | 'autopilot_generate'
  | 'moderation'
  | 'generic_ai';

export interface RateLimitRule {
  perMinute: number;
  perHour: number;
  perDay: number;
}

export const RATE_LIMITS: Record<RateLimitedEndpoint, Record<Tier, RateLimitRule>> = {
  coach_chat: {
    free: { perMinute: 3, perHour: 10, perDay: 20 },
    pro: { perMinute: 10, perHour: 100, perDay: 500 },
    premium: { perMinute: 20, perHour: 300, perDay: 2000 },
  },
  recognize_food: {
    free: { perMinute: 2, perHour: 5, perDay: 8 },
    pro: { perMinute: 5, perHour: 30, perDay: 100 },
    premium: { perMinute: 10, perHour: 100, perDay: 500 },
  },
  recognize_equipment: {
    free: { perMinute: 2, perHour: 5, perDay: 10 },
    pro: { perMinute: 5, perHour: 30, perDay: 100 },
    premium: { perMinute: 10, perHour: 100, perDay: 500 },
  },
  autopilot_generate: {
    free: { perMinute: 1, perHour: 2, perDay: 3 },
    pro: { perMinute: 2, perHour: 5, perDay: 10 },
    premium: { perMinute: 3, perHour: 10, perDay: 30 },
  },
  moderation: {
    free: { perMinute: 3, perHour: 10, perDay: 20 },
    pro: { perMinute: 5, perHour: 30, perDay: 100 },
    premium: { perMinute: 10, perHour: 100, perDay: 500 },
  },
  generic_ai: {
    free: { perMinute: 5, perHour: 20, perDay: 50 },
    pro: { perMinute: 15, perHour: 150, perDay: 1000 },
    premium: { perMinute: 30, perHour: 500, perDay: 3000 },
  },
};

export const SUSPICIOUS_THRESHOLDS = {
  callsPerMinuteToTriggerBlock: 50,
  blockDurationMinutes: 60,
  repeatedBlockDurationHours: 24,
};

export const IP_LIMITS: Record<RateLimitedEndpoint, RateLimitRule> = {
  coach_chat: { perMinute: 15, perHour: 100, perDay: 300 },
  recognize_food: { perMinute: 10, perHour: 50, perDay: 150 },
  recognize_equipment: { perMinute: 10, perHour: 50, perDay: 150 },
  autopilot_generate: { perMinute: 5, perHour: 20, perDay: 50 },
  moderation: { perMinute: 10, perHour: 50, perDay: 150 },
  generic_ai: { perMinute: 20, perHour: 200, perDay: 500 },
};
