import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState, type AppStateStatus } from "react-native";

function isActiveAppState(state: AppStateStatus): boolean {
  return state === "active";
}

/**
 * Calls `fn` every `intervalMs` ms only while the current screen is focused
 * and the app is foregrounded. Timer ticks never overlap.
 */
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
): void {
  const isFocused = useIsFocused();
  const fnRef = useRef(fn);
  const inFlight = useRef(false);
  const [appActive, setAppActive] = useState(() =>
    isActiveAppState(AppState.currentState),
  );

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      setAppActive(isActiveAppState(nextState));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !isFocused || !appActive) return;
    const id = setInterval(() => {
      if (inFlight.current) return;
      inFlight.current = true;
      void Promise.resolve(fnRef.current()).finally(() => {
        inFlight.current = false;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [appActive, enabled, intervalMs, isFocused]);
}
