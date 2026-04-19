/**
 * Haptic feedback utilities using @capacitor/haptics.
 * No-ops on web.
 */

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // not native — no-op
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // not native — no-op
  }
}

export async function hapticError(): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // not native — no-op
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // not native — no-op
  }
}
