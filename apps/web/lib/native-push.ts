/**
 * Native push notifications using @capacitor/push-notifications.
 * Registers the device token with the backend so the server can send pushes.
 */

import { isNative } from '@/lib/platform';

export async function initNativePush(): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      registerDeviceToken(token.value).catch(console.error);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] Registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('[push] Received foreground notification:', notification.title);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data as Record<string, string> | undefined;
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  } catch (err) {
    console.warn('[push] initNativePush failed:', err);
  }
}

export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: navigator.platform }),
    });
  } catch (err) {
    console.warn('[push] registerDeviceToken failed:', err);
  }
}
