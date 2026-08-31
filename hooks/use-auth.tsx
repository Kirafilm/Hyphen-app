import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import {
  clearSupabaseSession,
  persistAuthSession,
  refreshSupabaseSession,
  syncSessionFromSupabase,
} from "@/lib/auth-session";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { revenueCatLogOut } from "@/lib/revenuecat";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";

type AuthContextValue = {
  user: Auth.User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUserInfo(apiUser: NonNullable<Awaited<ReturnType<typeof Api.getMe>>>): Auth.User {
  return {
    id: apiUser.id,
    openId: apiUser.openId,
    name: apiUser.name,
    email: apiUser.email,
    loginMethod: apiUser.loginMethod,
    lastSignedIn: new Date(apiUser.lastSignedIn),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await syncSessionFromSupabase();

      let apiUser: Awaited<ReturnType<typeof Api.getMe>> = null;
      try {
        apiUser = await Api.getMe();
      } catch (err) {
        if (Api.isNetworkError(err)) {
          const cachedUser = await Auth.getUserInfo();
          if (cachedUser) {
            setUser(cachedUser);
            return;
          }
        }
        throw err;
      }

      if (!apiUser) {
        const refreshed = await refreshSupabaseSession();
        if (refreshed) {
          try {
            apiUser = await Api.getMe();
          } catch (err) {
            if (Api.isNetworkError(err)) {
              const cachedUser = await Auth.getUserInfo();
              if (cachedUser) {
                setUser(cachedUser);
                return;
              }
            }
          }
        }
      }

      if (apiUser) {
        const userInfo = toUserInfo(apiUser);
        setUser(userInfo);
        await Auth.setUserInfo(userInfo);
        return;
      }

      const cachedUser = await Auth.getUserInfo();
      const token = await Auth.getSessionToken();
      if (cachedUser && token) {
        setUser(cachedUser);
        return;
      }

      setUser(null);
      if (!token) {
        await Auth.clearUserInfo();
      }
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[Auth] fetchUser error:", nextError);
      setError(nextError);
      const cachedUser = await Auth.getUserInfo();
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        try {
          await revenueCatLogOut();
        } catch (err) {
          console.warn(
            "[Auth] RevenueCat logOut skipped:",
            err instanceof Error ? err.message : String(err),
          );
        }
      }
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
    } finally {
      await clearSupabaseSession();
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      void fetchUser();
      return;
    }

    void Auth.getUserInfo().then((cachedUser) => {
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
      }
    });
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void Auth.removeSessionToken();
        void Auth.clearUserInfo();
        setUser(null);
        return;
      }
      if (session) {
        void persistAuthSession(session);
        void fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncSessionFromSupabase({ forceRefresh: true }).then(() => fetchUser());
      }
    });
    return () => sub.remove();
  }, [fetchUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      refresh: fetchUser,
      logout,
    }),
    [user, loading, error, fetchUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(_options?: UseAuthOptions) {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
