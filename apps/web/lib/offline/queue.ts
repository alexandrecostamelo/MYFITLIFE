const QUEUE_KEY = 'myfitlife_offline_queue';

interface QueuedAction {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  timestamp: number;
}

export function queueOfflineAction(
  endpoint: string,
  method: string,
  body: unknown,
): void {
  if (typeof window === 'undefined') return;
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID(),
    endpoint,
    method,
    body,
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function flushQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      const res = await fetch(action.endpoint, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body),
      });
      if (res.ok) {
        synced++;
      } else {
        remaining.push(action);
        failed++;
      }
    } catch {
      remaining.push(action);
      failed++;
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed };
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
