import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key) return;

  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      element_allowlist: [
        'a',
        'button',
        'form',
        'input',
        'select',
        'textarea',
      ],
      css_selector_allowlist: ['[data-ph-capture]'],
    },
    capture_dead_clicks: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-mask]',
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug();
    },
  });

  initialized = true;
}

export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, properties);
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

export { posthog };
