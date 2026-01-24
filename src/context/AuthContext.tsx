"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, Profile, ProfileUpdate, Subscription, isDeveloperEmail } from "@/lib/supabase";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: 'user' | 'developer' | 'admin';
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ success: boolean; error?: string }>;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  enableAuth?: boolean;
}

export function AuthProvider({ children, enableAuth = true }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile and subscription data
  const fetchUserData = useCallback(async (userId: string, userEmail: string) => {
    try {
      // Fetch profile and subscription in parallel for better performance
      const [profileResult, subResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
      ]);

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileResult.error);
      }

      if (subResult.error && subResult.error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subResult.error);
      }

      const fetchedProfile = profileResult.data as Profile | null;
      const fetchedSubscription = subResult.data as Subscription | null;

      setProfile(fetchedProfile);
      setSubscription(fetchedSubscription);

      // Calculate access
      const isDev = isDeveloperEmail(userEmail) || fetchedProfile?.role === 'developer' || fetchedProfile?.role === 'admin';
      const hasPremium = isDev || (
        fetchedSubscription?.status === 'active' &&
        fetchedSubscription?.plan !== 'free' &&
        new Date(fetchedSubscription?.current_period_end || 0) > new Date()
      );

      setAccess({
        hasPremiumAccess: hasPremium,
        plan: fetchedSubscription?.plan || 'free',
        status: fetchedSubscription?.status || 'active',
        expiresAt: fetchedSubscription?.current_period_end || null,
        isDeveloper: isDev,
      });

      // Set user with profile data
      setUser({
        id: userId,
        email: userEmail,
        name: fetchedProfile?.name || null,
        username: fetchedProfile?.username || userEmail.split('@')[0],
        role: fetchedProfile?.role || (isDeveloperEmail(userEmail) ? 'developer' : 'user'),
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!enableAuth) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          await fetchUserData(currentSession.user.id, currentSession.user.email || '');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          await fetchUserData(newSession.user.id, newSession.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setSubscription(null);
          setAccess(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchUserData, enableAuth]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: 'Auth disabled in this context' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        await fetchUserData(data.user.id, data.user.email || '');
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: 'Auth disabled in this context' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { success: true, error: 'Please check your email to confirm your account.' };
      }

      if (data.session) {
        setSession(data.session);
        await fetchUserData(data.user!.id, data.user!.email || '');
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    if (!enableAuth) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      setAccess(null);
      return;
    }
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      setAccess(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: 'Auth disabled in this context' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: 'Auth disabled in this context' };
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (updates: ProfileUpdate): Promise<{ success: boolean; error?: string }> => {
    if (!enableAuth) {
      return { success: false, error: 'Auth disabled in this context' };
    }
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
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
        return { success: false, error: 'No updates provided' };
      }

      const { error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', session.user.id);

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
      }

      // Refresh user data after update
      await fetchUserData(session.user.id, session.user.email || '');

      return { success: true };
    } catch (error) {
      console.error('Profile update exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const refreshAccess = async (): Promise<void> => {
    if (!enableAuth) {
      return;
    }
    if (session?.user) {
      await fetchUserData(session.user.id, session.user.email || '');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      access,
      isLoading,
      login,
      signup,
      logout,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshAccess,
    }}>
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
