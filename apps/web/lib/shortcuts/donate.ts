import { Capacitor } from '@capacitor/core';
import Shortcuts from '@/plugins/shortcuts';

const SHORTCUT_MAP: Record<string, string> = {
  nutrition: 'app.myfitlife.log-meal',
  workout: 'app.myfitlife.start-workout',
  checkin: 'app.myfitlife.checkin',
  coach: 'app.myfitlife.coach',
  readiness: 'app.myfitlife.readiness',
};

export async function donateShortcut(feature: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios')
    return;
  const type = SHORTCUT_MAP[feature];
  if (!type) return;
  try {
    await Shortcuts.donate({ type });
  } catch {
    // silent — shortcut donation is non-critical
  }
}
