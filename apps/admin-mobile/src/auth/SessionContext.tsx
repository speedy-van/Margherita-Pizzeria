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
  setBaseUrl as persistBaseUrl,
  setDevBypass as persistDevBypass,
  setToken as persistToken,
} from "@/api/client";
import type { AdminUser, LoginResponse } from "@/api/types";
import { STORAGE_KEYS } from "@/config";

type SessionStatus = "unknown" | "signed-out" | "signed-in";

type SessionContextValue = {
  status: SessionStatus;
  user: AdminUser | null;
  baseUrl: string;
  devBypass: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  updateBaseUrl: (url: string) => Promise<void>;
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
      } else if (boot.devBypass) {
        setUser({ id: "dev", email: "dev@local", role: "admin" });
        setStatus("signed-in");
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
      setUser(res.data.user);
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
  }, []);

  const updateBaseUrl = useCallback(async (url: string) => {
    await persistBaseUrl(url);
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
      signIn,
      signOut,
      updateBaseUrl,
      setDevBypass,
    }),
    [status, user, baseUrl, devBypass, signIn, signOut, updateBaseUrl, setDevBypass],
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
