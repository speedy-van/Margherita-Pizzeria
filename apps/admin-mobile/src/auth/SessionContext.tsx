import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  apiCall,
  bootstrapSession,
  getBaseUrl,
  getLastAuthCheck,
  resetBaseUrl as persistResetBaseUrl,
  setBaseUrl as persistBaseUrl,
  setDevBypass as persistDevBypass,
  setToken as persistToken,
  setUnauthorizedHandler,
  type AuthCheckStatus,
} from "@/api/client";
import type { AdminUser, LoginResponse } from "@/api/types";
import { STORAGE_KEYS } from "@/config";

type SessionStatus = "unknown" | "signed-out" | "signed-in";

type MeResponse = { user: AdminUser };

type SessionContextValue = {
  status: SessionStatus;
  user: AdminUser | null;
  baseUrl: string;
  devBypass: boolean;
  lastAuthCheck: AuthCheckStatus | null;
  sessionMessage: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  updateBaseUrl: (url: string) => Promise<void>;
  resetBaseUrl: () => Promise<void>;
  setDevBypass: (enabled: boolean) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [status, setStatus] = useState<SessionStatus>("unknown");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string>(getBaseUrl());
  const [devBypass, setDevBypassState] = useState<boolean>(false);
  const [lastAuthCheck, setLastAuthCheck] = useState<AuthCheckStatus | null>(
    null,
  );
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const clearSession = useCallback(
    async (message: string | null): Promise<void> => {
      await persistToken(null);
      setUser(null);
      setStatus("signed-out");
      setSessionMessage(message);
      setLastAuthCheck(getLastAuthCheck());
    },
    [],
  );

  // Wire the global 401 handler exactly once. Any authenticated request
  // that comes back 401 will land here and bounce the user to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession(
        "Your session expired or was rejected. Please sign in again.",
      );
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const boot = await bootstrapSession();
      if (cancelled) return;
      setBaseUrlState(boot.baseUrl);
      setDevBypassState(boot.devBypass);

      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (boot.token) {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as AdminUser);
          } catch {
            /* ignore */
          }
        }
        setStatus("signed-in");
        // Re-validate the token against the server. If the backend now
        // rejects it (rotated secret, deleted user, role demoted) the
        // 401 handler above will clear the session automatically.
        const me = await apiCall<MeResponse>({ path: "/api/mobile/admin/me" });
        if (cancelled) return;
        setLastAuthCheck(getLastAuthCheck());
        if (me.ok && me.data?.user) {
          setUser(me.data.user);
          await AsyncStorage.setItem(
            STORAGE_KEYS.user,
            JSON.stringify(me.data.user),
          );
        }
      } else {
        setStatus("signed-out");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setSessionMessage(null);
      const res = await apiCall<LoginResponse>({
        method: "POST",
        path: "/api/mobile/admin/login",
        body: { email, password },
      });
      if (!res.ok) {
        return { ok: false as const, message: res.message };
      }
      await persistToken(res.data.token);
      await AsyncStorage.setItem(
        STORAGE_KEYS.tokenExpiresAt,
        res.data.expiresAt,
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify(res.data.user),
      );

      // Self-test: confirm the freshly-issued token is actually accepted
      // by the admin API. Catches misconfigured prod URLs (e.g. apex vs
      // www) where login succeeds but every subsequent admin request 401s.
      const me = await apiCall<MeResponse>({ path: "/api/mobile/admin/me" });
      setLastAuthCheck(getLastAuthCheck());
      if (!me.ok) {
        await persistToken(null);
        setUser(null);
        setStatus("signed-out");
        return {
          ok: false as const,
          message:
            "Login succeeded but admin session was rejected. Please contact support.",
        };
      }

      setUser(me.data?.user ?? res.data.user);
      setStatus("signed-in");
      return { ok: true as const };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await apiCall({ method: "POST", path: "/api/mobile/admin/logout" }).catch(
      () => undefined,
    );
    await persistToken(null);
    setUser(null);
    setStatus("signed-out");
    setSessionMessage(null);
  }, []);

  const updateBaseUrl = useCallback(async (url: string) => {
    await persistBaseUrl(url);
    setBaseUrlState(getBaseUrl());
  }, []);

  const resetBaseUrl = useCallback(async () => {
    await persistResetBaseUrl();
    setBaseUrlState(getBaseUrl());
  }, []);

  const setDevBypass = useCallback(async (enabled: boolean) => {
    await persistDevBypass(enabled);
    setDevBypassState(enabled);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      baseUrl,
      devBypass,
      lastAuthCheck,
      sessionMessage,
      signIn,
      signOut,
      updateBaseUrl,
      resetBaseUrl,
      setDevBypass,
    }),
    [
      status,
      user,
      baseUrl,
      devBypass,
      lastAuthCheck,
      sessionMessage,
      signIn,
      signOut,
      updateBaseUrl,
      resetBaseUrl,
      setDevBypass,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}
