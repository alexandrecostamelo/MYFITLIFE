/**
 * TV Bridge — opens the TV workout view in a new window/tab
 * and sends workout data via sessionStorage + postMessage.
 *
 * Works on any device with a browser (Smart TVs, second monitor, etc.)
 */

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration_sec?: number;
  thumbnail_url?: string;
}

export function openTVMode(
  exercises: Exercise[],
  workoutName: string,
): void {
  const data = JSON.stringify({ exercises, workoutName });
  const tvWindow = window.open(
    '/app/workout/tv',
    'myfitlife-tv',
    'width=1920,height=1080',
  );
  if (tvWindow) {
    // Wait for the page to load before sending data
    setTimeout(() => {
      tvWindow.sessionStorage.setItem('tv_workout', data);
      tvWindow.postMessage(
        { type: 'START_TV_WORKOUT', exercises, workoutName },
        '*',
      );
    }, 2000);
  }
}
