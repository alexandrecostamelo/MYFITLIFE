'use client';

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { createClient } from '@/lib/supabase/client';

export async function registerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await PushNotifications.checkPermissions();
  let status = perm.receive;
  if (status !== 'granted') {
    const req = await PushNotifications.requestPermissions();
    status = req.receive;
  }
  if (status !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (tokenEvent) => {
    try {
      const [info, deviceId] = await Promise.all([Device.getInfo(), Device.getId()]);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_push_tokens').upsert(
        {
          user_id: user.id,
          token: tokenEvent.value,
          platform: info.platform === 'ios' ? 'ios' : 'android',
          device_id: deviceId.identifier || null,
          device_model: `${info.manufacturer || ''} ${info.model || ''}`.trim() || null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );
    } catch (err) {
      console.error('[push] registration handler error:', err);
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[push] registration error:', error);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data as Record<string, string> | undefined;
    if (data?.link) {
      window.location.href = data.link;
    }
  });
}

export async function unregisterCurrentDevice(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const deviceId = await Device.getId();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !deviceId.identifier) return;
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('device_id', deviceId.identifier);
  } catch (err) {
    console.error('[push] unregister error:', err);
  }
}
