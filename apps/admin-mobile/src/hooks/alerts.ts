// Real-time alerts for the admin app.
//
// CRITICAL: Browser autoplay policy.
//   Chrome/Safari REFUSE `audio.play()` unless the call originates from a
//   user-activated stack (click/tap/keypress). The dashboard poller fires
//   from setInterval — NOT a user gesture — so calling .play() there gets
//   a `NotAllowedError` and the sound silently never plays. That was the
//   bug: the popup appeared but no sound.
//
// Fix: "prime" / "unlock" the audio element inside the LoginScreen submit
//   handler (which IS a user gesture). We do this by play()->pause() on a
//   single Audio element. After that the same element can be resumed from
//   any timer/promise without restriction. We reuse this primed element
//   for every alert, so all subsequent calls are gesture-free.

import { Platform, Vibration } from "react-native";
import { Image } from "react-native";
import { Asset } from "expo-asset";

// Bundled as a Metro asset (mp3 is in default assetExts). On web require()
// returns an asset module; we feed it to Image.resolveAssetSource to get a
// usable URI on every platform.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NEW_ORDER_SOUND = require("../../assets/sounds/new-order.mp3") as number;

let primedAudio: HTMLAudioElement | null = null;
let primeAttempted = false;
let vibrateActive = false;

function resolveSoundUri(): string | null {
  try {
    const src = Image.resolveAssetSource(NEW_ORDER_SOUND);
    if (src?.uri) return src.uri;
  } catch {
    /* ignore */
  }
  try {
    const asset = Asset.fromModule(NEW_ORDER_SOUND);
    return asset.localUri ?? asset.uri ?? null;
  } catch {
    return null;
  }
}

/**
 * Unlock browser audio so later programmatic .play() calls work.
 * MUST be called from inside a user-gesture handler (e.g. login button tap).
 * Safe to call repeatedly — only the first call does work.
 */
export async function primeAlertSound(): Promise<void> {
  if (Platform.OS !== "web") return;
  if (primeAttempted) return;
  primeAttempted = true;
  if (typeof window === "undefined" || typeof Audio === "undefined") return;
  const uri = resolveSoundUri();
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn("[alerts] could not resolve new-order.mp3 URI");
    return;
  }
  try {
    const a = new Audio(uri);
    a.loop = true;
    a.volume = 1.0;
    a.preload = "auto";
    // play() while still inside the gesture stack → browser grants the
    // element permanent permission. Then we immediately pause and rewind.
    await a.play();
    a.pause();
    a.currentTime = 0;
    primedAudio = a;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[alerts] audio prime failed:", err);
    primedAudio = null;
  }
}

/**
 * Start the alert sound LOOP. Continues until `stopAlertSound()` is called
 * (typically from the dialog's onClose handler).
 *
 * Web: resumes the primed HTMLAudioElement with loop=true.
 * Native: repeating vibration pattern (looped audio on native needs
 *   expo-av which is intentionally not wired yet).
 */
export function startAlertSound(): void {
  stopAlertSound();

  if (Platform.OS === "web") {
    if (!primedAudio) {
      // Last-resort: try to create one anyway. Will probably be blocked by
      // autoplay, but we log so the dev sees what happened.
      // eslint-disable-next-line no-console
      console.warn(
        "[alerts] primedAudio is null — call primeAlertSound() from a user gesture",
      );
      const uri = resolveSoundUri();
      if (!uri || typeof Audio === "undefined") return;
      try {
        const a = new Audio(uri);
        a.loop = true;
        a.volume = 1.0;
        void a.play().catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[alerts] fallback play() rejected:", err);
        });
        primedAudio = a;
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      primedAudio.currentTime = 0;
      primedAudio.loop = true;
      void primedAudio.play().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[alerts] play() rejected:", err);
      });
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    Vibration.vibrate([0, 400, 200, 400], true);
    vibrateActive = true;
  } catch {
    /* ignore */
  }
}

/** Stop the looping alert sound and any vibration. Safe to call multiple times. */
export function stopAlertSound(): void {
  if (primedAudio) {
    try {
      primedAudio.pause();
      primedAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  if (vibrateActive || Platform.OS !== "web") {
    try {
      Vibration.cancel();
    } catch {
      /* ignore */
    }
    vibrateActive = false;
  }
}

/** Ask the browser for permission to show OS notifications. No-op on native. */
export async function ensureBrowserNotificationPermission(): Promise<
  "granted" | "denied" | "default" | "unavailable"
> {
  if (Platform.OS !== "web") return "unavailable";
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unavailable";
  }
  const N = window.Notification;
  if (N.permission === "granted") return "granted";
  if (N.permission === "denied") return "denied";
  try {
    const result = await N.requestPermission();
    return result;
  } catch {
    return "default";
  }
}

/** Show an OS-level notification on web (works even when tab is not focused). */
export function showBrowserNotification(title: string, body: string): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;
  try {
    const n = new window.Notification(title, {
      body,
      requireInteraction: true,
      tag: "margherita-admin-alert",
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      n.close();
    };
  } catch {
    /* ignore */
  }
}

/** Back-compat no-op: priming now handles preload as a side effect. */
export function preloadAlertSound(): void {
  // No-op. The Audio element created by primeAlertSound() preloads itself.
}

/**
 * On web, register one-shot listeners for any user gesture (pointerdown,
 * keydown, touchstart) that will prime the audio element. This is needed
 * because a returning user with a persisted token (or dev bypass) lands
 * straight on the dashboard without tapping the Login button — so
 * primeAlertSound() from LoginScreen never runs and the first popup is
 * silent due to browser autoplay policy.
 *
 * Safe to call repeatedly; only the first call installs listeners, and
 * they remove themselves once any gesture fires.
 */
let gestureArmed = false;
export function armAlertSoundOnFirstGesture(): void {
  if (Platform.OS !== "web") return;
  if (gestureArmed) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  gestureArmed = true;

  const handler = (): void => {
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("keydown", handler, true);
    document.removeEventListener("touchstart", handler, true);
    void primeAlertSound();
  };
  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("keydown", handler, true);
  document.addEventListener("touchstart", handler, true);
}
