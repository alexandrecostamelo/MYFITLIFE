'use client';

import { useEffect, useRef } from 'react';
import { syncHealth } from '@/lib/health/sync';

export function HealthAutoSync({
  userId,
  enabled,
}: {
  userId: string;
  enabled: boolean;
}) {
  const synced = useRef(false);

  useEffect(() => {
    if (!enabled || synced.current) return;
    if (
      typeof window === 'undefined' ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(window as any).Capacitor?.isNativePlatform?.()
    )
      return;
    synced.current = true;
    syncHealth(userId).catch(() => null);
  }, [userId, enabled]);

  return null;
}
