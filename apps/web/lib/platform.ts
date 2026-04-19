/**
 * Platform detection utilities for Capacitor hybrid app.
 * All functions are safe to call on web (they return false/null when not native).
 */

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>)['Capacitor']
    && !!((window as unknown as Record<string, unknown>)['Capacitor'] as Record<string, unknown>)['isNativePlatform'];
}

export type Platform = 'ios' | 'android' | 'web';

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as unknown as Record<string, unknown>)['Capacitor'] as Record<string, unknown> | undefined;
  if (!cap) return 'web';
  const platform = cap['getPlatform'];
  if (typeof platform === 'function') {
    return (platform as () => Platform)();
  }
  return 'web';
}

/**
 * Safely import a Capacitor plugin — returns null on web if unavailable.
 */
export async function importCapacitorPlugin<T>(pluginName: string): Promise<T | null> {
  try {
    const { Plugins } = await import('@capacitor/core');
    const plugin = (Plugins as Record<string, unknown>)[pluginName] as T | undefined;
    return plugin ?? null;
  } catch {
    return null;
  }
}
