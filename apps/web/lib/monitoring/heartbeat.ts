export type HeartbeatJob =
  | 'autopilot'
  | 'proactive'
  | 'weekly_summary'
  | 'daily_cleanup';

const URL_MAP: Record<HeartbeatJob, string | undefined> = {
  autopilot: process.env.HEARTBEAT_AUTOPILOT_URL,
  proactive: process.env.HEARTBEAT_PROACTIVE_URL,
  weekly_summary: process.env.HEARTBEAT_WEEKLY_SUMMARY_URL,
  daily_cleanup: process.env.HEARTBEAT_DAILY_CLEANUP_URL,
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
