import { useCallback, useEffect, useState } from "react";

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

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const res: ApiCallResult<T> = await apiCall<T>({ path });
    if (res.ok) {
      setState({ data: res.data, loading: false, error: null });
    } else {
      setState({
        data: null,
        loading: false,
        error: `${res.code}: ${res.message}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
