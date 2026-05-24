import { useEffect } from "react";

/**
 * Calls `fn` every `intervalMs` ms while `enabled`. Cleans up on unmount.
 * Use with `useFocusEffect` if polling should be tied to screen focus.
 */
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      void fn();
    }, intervalMs);
    return () => clearInterval(id);
  }, [fn, intervalMs, enabled]);
}
