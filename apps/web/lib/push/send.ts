import { createClient } from '@supabase/supabase-js';
import { getFirebaseMessaging } from './firebase-admin';
import type { Message } from 'firebase-admin/messaging';

export type PushType =
  | 'friend_request'
  | 'friend_workout'
  | 'challenge_invite'
  | 'chat_message'
  | 'friend_achievement';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  link?: string;
  badge?: number;
}

function isInQuietHours(now: Date, startStr: string, endStr: string, timezone: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const cur = h * 60 + m;
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function sendPushToUser(
  userId: string,
  type: PushType,
  payload: PushPayload
): Promise<{ success: number; failure: number; pruned: number }> {
  const supabase = getAdminSupabase();

  const { data: prefs } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (prefs) {
    const prefKey = `push_${type}`;
    if ((prefs as Record<string, unknown>)[prefKey] === false) {
      return { success: 0, failure: 0, pruned: 0 };
    }

    if (
      prefs.quiet_hours_start &&
      prefs.quiet_hours_end &&
      isInQuietHours(
        new Date(),
        prefs.quiet_hours_start as string,
        prefs.quiet_hours_end as string,
        (prefs.timezone as string) || 'America/Sao_Paulo'
      )
    ) {
      return { success: 0, failure: 0, pruned: 0 };
    }
  }

  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('id, token, platform')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) {
    return { success: 0, failure: 0, pruned: 0 };
  }

  let messaging: ReturnType<typeof getFirebaseMessaging>;
  try {
    messaging = getFirebaseMessaging();
  } catch {
    return { success: 0, failure: 0, pruned: 0 };
  }

  let success = 0;
  let failure = 0;
  const tokensToPrune: string[] = [];

  const data: Record<string, string> = { type, ...(payload.data || {}) };
  if (payload.link) data.link = payload.link;

  await Promise.all(
    (tokens as { id: string; token: string; platform: string }[]).map(async (t) => {
      const msg: Message = {
        token: t.token,
        notification: { title: payload.title, body: payload.body },
        data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'social',
            sound: 'default',
            clickAction: 'FCM_PLUGIN_ACTIVITY',
          },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: {
            aps: {
              alert: { title: payload.title, body: payload.body },
              sound: 'default',
              badge: payload.badge,
            },
          },
        },
      };
      try {
        await messaging.send(msg);
        success++;
      } catch (err: unknown) {
        failure++;
        const code =
          (err as { code?: string })?.code ||
          (err as { errorInfo?: { code?: string } })?.errorInfo?.code ||
          '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          tokensToPrune.push(t.token);
        }
      }
    })
  );

  if (tokensToPrune.length > 0) {
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId)
      .in('token', tokensToPrune);
  }

  await supabase.from('push_notification_log').insert({
    user_id: userId,
    type,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    success_count: success,
    failure_count: failure,
    tokens_pruned: tokensToPrune.length,
  });

  return { success, failure, pruned: tokensToPrune.length };
}

export async function sendPushToUsers(
  userIds: string[],
  type: PushType,
  payload: PushPayload
): Promise<void> {
  await Promise.all(userIds.map((id) => sendPushToUser(id, type, payload)));
}
