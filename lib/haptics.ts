/**
 * Haptic feedback utility for mobile tactile interactions.
 * Safely calls navigator.vibrate() when supported on mobile devices
 * without throwing errors on unsupported desktop browsers.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(40);
        break;
      case 'success':
        navigator.vibrate([15, 50, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 30, 50, 30, 50]);
        break;
    }
  } catch {
    // Graceful silent fallback if vibrating is disallowed by browser policy
  }
}
