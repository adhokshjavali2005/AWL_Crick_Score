import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { upsertProfile } from '@/lib/api';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Store display names in localStorage as a fallback
const NAMES_KEY = 'criclive_display_names';

function saveName(userId: string, name: string) {
  try {
    const stored = localStorage.getItem(NAMES_KEY);
    const names = stored ? JSON.parse(stored) : {};
    names[userId] = name;
    localStorage.setItem(NAMES_KEY, JSON.stringify(names));
  } catch { /* ignore */ }
}

function getName(userId: string): string | null {
  try {
    const stored = localStorage.getItem(NAMES_KEY);
    if (stored) {
      const names = JSON.parse(stored);
      return names[userId] || null;
    }
  } catch { /* ignore */ }
  return null;
}

function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const su = session.user;
  const name = su.user_metadata?.name || su.user_metadata?.full_name || getName(su.id) || su.email?.split('@')[0] || 'User';
  return {
    id: su.id,
    name,
    email: su.email || '',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Initialize: check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = sessionToUser(session);
      setState({ user, isAuthenticated: !!user, loading: false });
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = sessionToUser(session);
      setState({ user, isAuthenticated: !!user, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return error.message;
    if (!data.user) return 'Registration failed. Please try again.';

    saveName(data.user.id, name);
    try { await upsertProfile(name, email); } catch { /* backend may not be ready */ }
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (!data.user) return 'Login failed. Please try again.';

    const name = data.user.user_metadata?.name || getName(data.user.id) || email.split('@')[0];
    try { await upsertProfile(name, email); } catch { /* backend may not be ready */ }
    return null;
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
