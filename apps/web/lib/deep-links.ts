/**
 * Deep link handling for Capacitor native apps.
 * Maps myfitlife:// URLs to in-app routes.
 */

import { isNative } from '@/lib/platform';

export type DeepLinkRoute =
  | { type: 'app'; path: string }
  | { type: 'unknown'; url: string };

export function parseDeepLink(url: string): DeepLinkRoute {
  try {
    const parsed = new URL(url);

    // Handle both myfitlife:// and https://myfitlife.app/ schemes
    if (parsed.protocol === 'myfitlife:' || parsed.hostname === 'myfitlife.app') {
      const path = parsed.pathname || parsed.hostname;
      // Map deep link path to Next.js app route
      const routeMap: Record<string, string> = {
        '/workout': '/app/workouts',
        '/challenges': '/app/challenges',
        '/marketplace': '/app/marketplace',
        '/profile': '/app/profile',
        '/plans': '/app/plans',
        '/billing': '/app/billing',
        '/nutrition': '/app/nutrition',
        '/checkin': '/app/checkin',
        '/coach': '/app/coach',
        '/readiness': '/app/health/readiness',
        '/recipes': '/app/nutrition/recipes',
        '/goals': '/app/goals',
      };
      const route = routeMap[path] ?? `/app${path}`;
      return { type: 'app', path: route };
    }
  } catch {
    // ignore parse errors
  }
  return { type: 'unknown', url };
}

type DeepLinkCallback = (route: DeepLinkRoute) => void;
const listeners: DeepLinkCallback[] = [];

export function onDeepLink(cb: DeepLinkCallback): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notifyListeners(url: string) {
  const route = parseDeepLink(url);
  listeners.forEach((cb) => cb(route));
}

export async function initDeepLinks(): Promise<void> {
  if (!isNative()) return;
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('appUrlOpen', (event) => {
      notifyListeners(event.url);
    });
  } catch (err) {
    console.warn('[deep-links] initDeepLinks failed:', err);
  }
}
