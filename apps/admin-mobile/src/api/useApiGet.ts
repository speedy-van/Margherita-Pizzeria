import { useCallback, useEffect, useRef, useState } from "react";

import { apiCall, type ApiCallResult } from "@/api/client";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

/**
 * Lightweight GET hook. Returns data + reload(). Replays the request when
 * `deps` change. Used by every list/detail screen.
 */
export function useApiGet<T>(
  path: string,
  deps: ReadonlyArray<unknown> = [],
): State<T> & { reload: () => Promise<void> } {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const mountedRef = useRef(false);
  const inflightRef = useRef(false);
  const queuedRef = useRef(false);
  const pathRef = useRef(path);
  const latestReloadRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  const reload = useCallback(async () => {
    if (inflightRef.current) {
      queuedRef.current = true;
      return;
    }

    inflightRef.current = true;
    try {
      let runAgain = true;
      while (runAgain && mountedRef.current) {
        queuedRef.current = false;
        const requestPath = path;
        setState((s) => ({ ...s, loading: true, error: null }));
        const res: ApiCallResult<T> = await apiCall<T>({ path: requestPath });
        if (!mountedRef.current || pathRef.current !== requestPath) {
          runAgain = queuedRef.current;
          break;
        }
        if (res.ok) {
          setState({ data: res.data, loading: false, error: null });
        } else {
          setState((s) => ({
            data: s.data,
            loading: false,
            error: `${res.code}: ${res.message}`,
          }));
        }
        runAgain = queuedRef.current;
      }
    } finally {
      inflightRef.current = false;
      if (queuedRef.current && mountedRef.current) {
        queuedRef.current = false;
        void latestReloadRef.current();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    latestReloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
