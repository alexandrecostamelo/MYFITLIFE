'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initDeepLinks, onDeepLink } from '@/lib/deep-links';
import { initNativePush } from '@/lib/native-push';
import { isNative } from '@/lib/platform';

/**
 * Initializes deep link and push notification listeners.
 * Must be rendered once inside the app shell (authenticated layout).
 */
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isNative()) return;

    // Init deep links
    initDeepLinks().then(() => {
      const unsub = onDeepLink((route) => {
        if (route.type === 'app') {
          router.push(route.path);
        }
      });
      return unsub;
    }).catch(console.error);

    // Init push notifications
    initNativePush().catch(console.error);
  }, [router]);

  return null;
}
