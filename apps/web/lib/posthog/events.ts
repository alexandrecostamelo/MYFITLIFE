import { trackEvent } from './client';

export const analytics = {
  // Auth
  signUp: (method: string) => trackEvent('user_signed_up', { method }),
  login: (method: string) => trackEvent('user_logged_in', { method }),

  // Subscription
  startTrial: () => trackEvent('trial_started'),
  subscribe: (tier: string, method: string) =>
    trackEvent('subscription_created', { tier, method }),
  cancelStart: () => trackEvent('cancel_flow_started'),
  cancelComplete: (reason: string) =>
    trackEvent('cancel_completed', { reason }),
  cancelRetained: (offer: string) =>
    trackEvent('cancel_retained', { offer }),

  // AI features
  generateAutopilot: () => trackEvent('autopilot_generated'),
  coachMessage: () => trackEvent('coach_message_sent'),
  photoRecognition: (type: 'food' | 'equipment') =>
    trackEvent('photo_recognized', { type }),

  // Core actions
  workoutCompleted: (duration: number, type: string) =>
    trackEvent('workout_completed', { duration, type }),
  mealLogged: (method: string) => trackEvent('meal_logged', { method }),
  checkinDone: () => trackEvent('checkin_completed'),
  goalCreated: (category: string) =>
    trackEvent('goal_created', { category }),

  // Features
  trailStarted: (slug: string) => trackEvent('trail_started', { slug }),
  classBooked: (modality: string) =>
    trackEvent('class_booked', { modality }),
  recipeViewed: (region: string) =>
    trackEvent('recipe_viewed', { region }),
  runCompleted: (distance: number) =>
    trackEvent('run_completed', { distance_km: distance / 1000 }),

  // Monetization
  upgradeViewed: () => trackEvent('upgrade_page_viewed'),
  paywallHit: (feature: string) =>
    trackEvent('paywall_hit', { feature }),

  // Health
  healthSynced: (source: string) =>
    trackEvent('health_synced', { source }),
  importWorkouts: (source: string, count: number) =>
    trackEvent('workouts_imported', { source, count }),
};
