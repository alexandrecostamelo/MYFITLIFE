import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@myfitlife.app';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToUser(supabase: Client, userId: string, payload: PushPayload): Promise<number> {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_enabled, quiet_hours_start, quiet_hours_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (!prefs?.push_enabled) return 0;

  if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const now = new Date();
    const hourNow = now.getHours() * 60 + now.getMinutes();
    const [qsH, qsM] = (prefs.quiet_hours_start as string).split(':').map(Number);
    const [qeH, qeM] = (prefs.quiet_hours_end as string).split(':').map(Number);
    const qs = qsH * 60 + qsM;
    const qe = qeH * 60 + qeM;
    const inQuiet = qs > qe ? hourNow >= qs || hourNow < qe : hourNow >= qs && hourNow < qe;
    if (inQuiet) return 0;
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return 0;

  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          expired.push(sub.id);
        } else {
          console.error('[sendPushToUser]', err.statusCode, err.message);
        }
      }
    })
  );

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired);
  }

  return sent;
}
