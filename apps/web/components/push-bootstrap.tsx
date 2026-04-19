'use client';

import { useEffect } from 'react';
import { registerPushNotifications } from '@/lib/push/register-device';

export function PushBootstrap() {
  useEffect(() => {
    registerPushNotifications().catch(console.error);
  }, []);
  return null;
}
