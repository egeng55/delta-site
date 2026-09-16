"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  Profile,
  ProfileUpdate,
  Subscription,
  isDeveloperEmail,
} from "@/lib/supabase";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: "user" | "developer" | "admin";
}

interface AccessInfo {
  hasPremiumAccess: boolean;
  plan: string;
  status: string;
  expiresAt: string | null;
  isDeveloper: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  access: AccessInfo | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    updates: ProfileUpdate,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  enableAuth?: boolean;
}

export function AuthProvider({
  children,
  enableAuth = true,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const identity = useRef<string | null>(null);
  const profileRevision = useRef(0);

  // Fetch profile and subscription data
  const fetchUserData = useCallback(
    async (userId: string, userEmail: string) => {
      const revision = ++profileRevision.current;
      try {
        // Fetch profile and subscription in parallel for better performance
        const [profileResult, subResult] = await Promise.all([
          getSupabase().from("profiles").select("*").eq("id", userId).single(),
          getSupabase()
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .single(),
        ]);

        if (identity.current !== userId || revision !== profileRevision.current)
          return;

        if (profileResult.error && profileResult.error.code !== "PGRST116") {
          console.error("profile_read_unavailable");
        }

        if (subResult.error && subResult.error.code !== "PGRST116") {
          console.error("subscription_read_unavailable");
        }

        const fetchedProfile = profileResult.data as Profile | null;
        const fetchedSubscription = subResult.data as Subscription | null;

        setProfile(fetchedProfile);
        setSubscription(fetchedSubscription);

        // Calculate access
        const isDev =
          isDeveloperEmail(userEmail) ||
          fetchedProfile?.role === "developer" ||
          fetchedProfile?.role === "admin";
        const hasPremium =
          isDev ||
          (fetchedSubscription?.status === "active" &&
            fetchedSubscription?.plan !== "free" &&
            new Date(fetchedSubscription?.current_period_end || 0) >
              new Date());

        setAccess({
          hasPremiumAccess: hasPremium,
          plan: fetchedSubscription?.plan || "free",
          status: fetchedSubscription?.status || "active",
          expiresAt: fetchedSubscription?.current_period_end || null,
          isDeveloper: isDev,
        });

        // Set user with profile data
        setUser({
          id: userId,
          email: userEmail,
          name: fetchedProfile?.name || null,
          username: fetchedProfile?.username || userEmail.split("@")[0],
          role:
            fetchedProfile?.role ||
            (isDeveloperEmail(userEmail) ? "developer" : "user"),
        });
      } catch {
        console.error("account_details_unavailable");
      }
    },
    [],
  );

  // Initialize auth state
  useEffect(() => {
    if (!enableAuth) {
      setIsLoading(false);
      return;
    }

    let client: ReturnType<typeof getSupabase>;
    try {
      client = getSupabase();
    } catch {
      setIsLoading(false);
      return;
    }
    let active = true;
    let observedEvent = false;
    let detailsTimer: ReturnType<typeof setTimeout>;
    const acceptSession = (newSession: Session | null) => {
      if (!active) return;
      clearTimeout(detailsTimer);
      identity.current = newSession?.user.id ?? null;
      profileRevision.current++;
      setSession(newSession);
      setProfile(null);
      setSubscription(null);
      setAccess(null);
      if (newSession?.user) {
        const { id, email = "" } = newSession.user;
        setUser({
          id,
          email,
          name: null,
          username: email.split("@")[0],
          role: "user",
        });
        // Supabase callbacks run under its auth lock. Optional account reads
        // must start after the callback returns and never delay sign-in.
        detailsTimer = setTimeout(() => {
          if (active) void fetchUserData(id, email);
        }, 0);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    const {
      data: { subscription: authSubscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        observedEvent = true;
        acceptSession(newSession);
      },
    );
    void client.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!observedEvent) acceptSession(data.session);
      })
      .catch(() => {
        if (!observedEvent) acceptSession(null);
      });
    const startupDeadline = setTimeout(() => {
      if (active) setIsLoading(false);
    }, 10000);

    return () => {
      active = false;
      identity.current = null;
      clearTimeout(detailsTimer);
      clearTimeout(startupDeadline);
      authSubscription.unsubscribe();
    };
  }, [fetchUserData, enableAuth]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: "Auth disabled in this context" };
    }
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        identity.current = data.user.id;
        setSession(data.session);
        const email = data.user.email || "";
        setUser({
          id: data.user.id,
          email,
          name: null,
          username: email.split("@")[0],
          role: "user",
        });
      } else {
        return {
          success: false,
          error: "Sign-in did not establish a session. Please try again.",
        };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async (): Promise<void> => {
    identity.current = null;
    profileRevision.current++;
    if (!enableAuth) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      setAccess(null);
      return;
    }
    try {
      await getSupabase().auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      setAccess(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const resetPassword = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: "Auth disabled in this context" };
    }
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updatePassword = async (
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: "Auth disabled in this context" };
    }
    try {
      const { error } = await getSupabase().auth.updateUser({
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updateProfile = async (
    updates: ProfileUpdate,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: "Auth disabled in this context" };
    }
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Filter out undefined values to avoid sending them to Supabase
      const cleanUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }

      if (Object.keys(cleanUpdates).length === 0) {
        return { success: false, error: "No updates provided" };
      }

      const { error } = await getSupabase()
        .from("profiles")
        .update(cleanUpdates as never)
        .eq("id", session.user.id);

      if (error) {
        console.error("Profile update error:", error);
        return { success: false, error: error.message };
      }

      // Refresh user data after update
      await fetchUserData(session.user.id, session.user.email || "");

      return { success: true };
    } catch (error) {
      console.error("Profile update exception:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const refreshAccess = async (): Promise<void> => {
    if (!enableAuth) {
      return;
    }
    if (session?.user) {
      await fetchUserData(session.user.id, session.user.email || "");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        access,
        isLoading,
        login,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
