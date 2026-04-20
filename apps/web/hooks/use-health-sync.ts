'use client';

import { useState, useCallback } from 'react';
import { getHealthBridge } from '@/lib/health/bridge';
import { syncHealth } from '@/lib/health/sync';

export function useHealthSync(userId: string | null) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    synced: number;
    errors: number;
  } | null>(null);

  const isNative =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).Capacitor?.isNativePlatform?.();

  const checkAvailable = useCallback(async () => {
    if (!isNative) return false;
    const bridge = getHealthBridge();
    if (!bridge) return false;
    return bridge.isAvailable();
  }, [isNative]);

  const requestPermissions = useCallback(async () => {
    const bridge = getHealthBridge();
    if (!bridge) return false;
    return bridge.requestPermissions();
  }, []);

  const sync = useCallback(async () => {
    if (!userId || syncing) return;
    setSyncing(true);
    try {
      const result = await syncHealth(userId);
      setLastResult(result);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [userId, syncing]);

  return {
    isNative,
    syncing,
    lastResult,
    checkAvailable,
    requestPermissions,
    sync,
  };
}
