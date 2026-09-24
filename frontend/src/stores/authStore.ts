import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api, AUTH_STORAGE_KEY } from "@/api/client";
import type { User } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const response = await api.post("/auth/login/", { username, password });
        const { access, refresh, user } = response.data;
        set({ accessToken: access, refreshToken: refresh, user, isAuthenticated: true });
      },

      logout: () => {
        const refresh = get().refreshToken;
        if (refresh) {
          api.post("/auth/logout/", { refresh }).catch(() => undefined);
        }
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const response = await api.get("/auth/me/");
        set({ user: response.data, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
