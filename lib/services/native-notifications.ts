'use client';

// ============================================================================
// Minerva Native Browser Notification & Audio Service
// Supports HTML5 Web Notification API, gentle Web Audio chimes, and permission checks.
// ============================================================================

export interface NativeNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
}

/**
 * Plays a discrete, pleasant 2-tone chime using the Web Audio API without needing external assets.
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // First note (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    // Second note (1318.5 Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.debug('[NotificationSound] Audio play ignored or blocked:', err);
  }
}

/**
 * Returns the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Asks the user for native browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[NativeNotification] Request failed:', err);
    return Notification.permission;
  }
}

/**
 * Dispatches a native desktop notification with audio chime and optional click action.
 */
export function sendNativeNotification(options: NativeNotificationOptions): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  // Play subtle audio cue
  playNotificationSound();

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
    });

    if (options.url) {
      notif.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (window.location.pathname !== options.url) {
          window.location.href = options.url as string;
        }
        notif.close();
      };
    }

    return notif;
  } catch (err) {
    console.warn('[NativeNotification] Failed to display notification:', err);
    return null;
  }
}
