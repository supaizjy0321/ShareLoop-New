import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'vendor' | 'customer';
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string, role: 'vendor' | 'customer') => Promise<void>;
  logout: () => void;
  updateAddress: (address: string | null, latitude: number | null, longitude: number | null) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const fetchProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, address, latitude, longitude')
    .eq('id', supabaseUser.id)
    .single();
  if (error || !data) return null;
  const role: 'vendor' | 'customer' =
    data.role === 'vendor' ? 'vendor' : 'customer';
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    full_name: data.full_name,
    role,
    address: data.address ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // IMPORTANT: Do NOT make this callback async or `await` Supabase calls inside it.
    // The auth-js library holds an internal lock while dispatching events; awaiting
    // another Supabase query in here deadlocks signInWithPassword / signUp etc.
    // Defer all data fetching with setTimeout(..., 0) instead.
    // https://supabase.com/docs/reference/javascript/auth-onauthstatechange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const supabaseUser = session.user;
        setTimeout(() => {
          void fetchProfile(supabaseUser).then(profile => setUser(profile));
        }, 0);
      } else {
        setUser(null);
      }
    });

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        }
      } catch (e) {
        console.error('Auth init failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    void init();

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (data.user) {
        const profile = await fetchProfile(data.user);
        if (!profile) {
          await supabase.auth.signOut();
          throw new Error(
            'Could not load your profile. Check your connection or try again.',
          );
        }
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      full_name: string,
      role: 'vendor' | 'customer',
    ) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name, role } },
        });
        if (error) throw new Error(error.message);
        if (data.user && data.session) {
          const profile = await fetchProfile(data.user);
          if (profile) setUser(profile);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateAddress = useCallback(
    async (
      address: string | null,
      latitude: number | null,
      longitude: number | null,
    ) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ address, latitude, longitude })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
      setUser(prev =>
        prev ? { ...prev, address, latitude, longitude } : prev,
      );
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, updateAddress, isLoading }}
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
