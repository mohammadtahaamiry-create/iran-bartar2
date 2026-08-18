'use client';

import { create } from 'zustand';

export interface AppUser {
  id: string;
  email: string;
  firstName: string | null;
  name: string | null;
  role: string;
  onboarded: boolean;
  createdAt?: string;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      set({ user: data.user || null, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    set({ user: null });
  },
}));
