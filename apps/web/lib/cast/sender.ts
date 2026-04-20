/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Chromecast sender helpers.
 * Uses the Chrome Cast SDK (chrome.cast) available in Chrome browsers
 * and Android WebViews with Play Services.
 */

export function isCastAvailable(): boolean {
  return (
    typeof window !== 'undefined' && !!(window as any).chrome?.cast
  );
}

export function initCast(receiverAppId: string): void {
  if (!isCastAvailable()) return;

  const chrome = (window as any).chrome;
  const sessionRequest = new chrome.cast.SessionRequest(receiverAppId);
  const apiConfig = new chrome.cast.ApiConfig(
    sessionRequest,
    (session: any) => {
      console.log('[cast] session started:', session.sessionId);
    },
    (availability: string) => {
      console.log('[cast] availability:', availability);
    },
  );

  chrome.cast.initialize(apiConfig);
}

export function castWorkout(
  exercises: any[],
  workoutName: string,
): void {
  const chrome = (window as any).chrome;
  if (!chrome?.cast) return;

  chrome.cast.requestSession((session: any) => {
    const namespace = 'urn:x-cast:app.myfitlife';
    session.sendMessage(namespace, {
      type: 'START_TV_WORKOUT',
      exercises,
      workoutName,
    });
  });
}
