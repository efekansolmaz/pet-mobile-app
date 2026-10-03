import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { API_PREFIX } from '@/constants/api';
import type { User } from '@/types/models';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (access: string, refresh: string, user?: User | null) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,
  setSession: async (access, refresh, user = null) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    set({ accessToken: access, refreshToken: refresh, user });
  },
  hydrate: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    set({ accessToken, refreshToken, hydrated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  setUser: (user) => set({ user }),
}));

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;
  const response = await fetch(`${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    await useAuthStore.getState().logout();
    return null;
  }
  const data = (await response.json()) as { access_token: string; refresh_token: string };
  await useAuthStore.getState().setSession(data.access_token, data.refresh_token);
  return data.access_token;
}
