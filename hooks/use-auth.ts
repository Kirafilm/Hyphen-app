import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { clearSupabaseSession, persistAuthSession, syncSessionFromSupabase } from "@/lib/auth-session";
import { revenueCatLogOut } from "@/lib/revenuecat";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Web platform: use cookie-based auth, fetch user from API
      if (Platform.OS === "web") {
        await syncSessionFromSupabase();
        console.log("[useAuth] Web platform: fetching user from API...");
        const apiUser = await Api.getMe();
        console.log("[useAuth] API user response:", apiUser);

        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          // Cache user info in localStorage for faster subsequent loads
          await Auth.setUserInfo(userInfo);
          console.log("[useAuth] Web user set from API:", userInfo);
        } else {
          const sessionToken = await Auth.getSessionToken();
          if (sessionToken) {
            const cachedUser = await Auth.getUserInfo();
            if (cachedUser) {
              console.log("[useAuth] Web: API returned null, using cached user");
              setUser(cachedUser);
              return;
            }
          }
          console.log("[useAuth] Web: No authenticated user from API");
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      // Native platform: restore/refresh Supabase session, then validate with API.
      console.log("[useAuth] Native platform: syncing session...");
      const sessionToken = await syncSessionFromSupabase();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[useAuth] No session token, setting user to null");
        setUser(null);
        return;
      }

      console.log("[useAuth] Native: validating session token with API...");
      let apiUser: Awaited<ReturnType<typeof Api.getMe>> = null;
      try {
        apiUser = await Api.getMe();
      } catch (err) {
        if (Api.isNetworkError(err)) {
          console.warn("[useAuth] Native: API unreachable, keeping cached session");
          const cachedUser = await Auth.getUserInfo();
          if (cachedUser) {
            setUser(cachedUser);
            return;
          }
        }
        throw err;
      }

      if (apiUser) {
        const userInfo: Auth.User = {
          id: apiUser.id,
          openId: apiUser.openId,
          name: apiUser.name,
          email: apiUser.email,
          loginMethod: apiUser.loginMethod,
          lastSignedIn: new Date(apiUser.lastSignedIn),
        };
        setUser(userInfo);
        await Auth.setUserInfo(userInfo);
        console.log("[useAuth] Native user set from API:", userInfo);
        return;
      }

      console.log("[useAuth] Native: API returned null, clearing auth state");
      setUser(null);
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
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
      // Continue with logout even if API call fails
    } finally {
      await clearSupabaseSession();
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: fetch user from API directly (user will login manually if needed)
        console.log("[useAuth] Web: fetching user from API...");
        fetchUser();
      } else {
        // Native: show cached user quickly, then validate in background.
        Auth.getUserInfo()
          .then((cachedUser) => {
            console.log("[useAuth] Native cached user check:", cachedUser);
            if (cachedUser) {
              console.log("[useAuth] Native: setting cached user immediately");
              setUser(cachedUser);
              setLoading(false);
            }
          })
          .finally(() => {
            // Always validate token state to prevent stale "logged-in" UI.
            fetchUser();
          });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}
