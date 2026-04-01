import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { registerPushToken } from './notifications';
import type { Session, User } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  messages_remaining: number;
  points: number;
  is_premium: boolean;
  trial_expires_at: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, messages_remaining, points, is_premium, trial_expires_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[Auth] Erreur chargement profil:', error.message);
        return;
      }
      setProfile(data as Profile);
    } catch (err) {
      console.warn('[Auth] fetchProfile exception:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listener changements d'état
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
          // Enregistrer le token push au premier login
          if (event === 'SIGNED_IN') {
            registerPushToken(s.user.id);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}
