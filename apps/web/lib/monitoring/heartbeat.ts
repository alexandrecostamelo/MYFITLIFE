export type HeartbeatJob =
  | 'autopilot'
  | 'proactive'
  | 'weekly_summary'
  | 'daily_cleanup'
  | 'nfse_queue'
  | 'pix_renewals'
  | 'pix_check_payments'
  | 'nfse_sub_queue'
  | 'premium_quota_reset'
  | 'backup'
  | 'wearable_sync'
  | 'winback_email'
  | 'unpause_subscriptions'
  | 'apply_scheduled_changes'
  | 'challenges_status'
  | 'video_rooms_cleanup'
  | 'class_reminders';

const URL_MAP: Record<HeartbeatJob, string | undefined> = {
  autopilot: process.env.HEARTBEAT_AUTOPILOT_URL,
  proactive: process.env.HEARTBEAT_PROACTIVE_URL,
  weekly_summary: process.env.HEARTBEAT_WEEKLY_SUMMARY_URL,
  daily_cleanup: process.env.HEARTBEAT_DAILY_CLEANUP_URL,
  nfse_queue: process.env.HEARTBEAT_NFSE_QUEUE_URL,
  pix_renewals: process.env.HEARTBEAT_PIX_RENEWALS_URL,
  pix_check_payments: process.env.HEARTBEAT_PIX_CHECK_PAYMENTS_URL,
  nfse_sub_queue: process.env.HEARTBEAT_NFSE_SUB_QUEUE_URL,
  premium_quota_reset: process.env.HEARTBEAT_PREMIUM_QUOTA_RESET_URL,
  backup: process.env.HEARTBEAT_BACKUP_URL,
  wearable_sync: process.env.HEARTBEAT_WEARABLE_SYNC_URL,
  winback_email: process.env.HEARTBEAT_WINBACK_EMAIL_URL,
  unpause_subscriptions: process.env.HEARTBEAT_UNPAUSE_SUBSCRIPTIONS_URL,
  apply_scheduled_changes: process.env.HEARTBEAT_APPLY_SCHEDULED_CHANGES_URL,
  challenges_status: process.env.HEARTBEAT_CHALLENGES_STATUS_URL,
  video_rooms_cleanup: process.env.HEARTBEAT_VIDEO_ROOMS_CLEANUP_URL,
  class_reminders: process.env.HEARTBEAT_CLASS_REMINDERS_URL,
};

export async function sendHeartbeat(
  job: HeartbeatJob,
  status: 'start' | 'success' | 'fail' = 'success',
  message?: string
): Promise<void> {
  const baseUrl = URL_MAP[job];
  if (!baseUrl) return;

  let url = baseUrl;
  if (status === 'start') url = `${baseUrl}/start`;
  if (status === 'fail') url = `${baseUrl}/fail`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: message?.slice(0, 500) || '',
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn(`[heartbeat] ${job}/${status} failed:`, err);
  }
}

export async function withHeartbeat<T>(
  job: HeartbeatJob,
  fn: () => Promise<T>
): Promise<T> {
  await sendHeartbeat(job, 'start');
  try {
    const result = await fn();
    await sendHeartbeat(job, 'success');
    return result;
  } catch (err: unknown) {
    await sendHeartbeat(job, 'fail', (err as Error)?.message || 'unknown error');
    throw err;
  }
}
