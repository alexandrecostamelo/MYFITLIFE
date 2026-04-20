import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event) {
    // Filter noisy errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') return null;
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver'))
      return null;
    return event;
  },
});
