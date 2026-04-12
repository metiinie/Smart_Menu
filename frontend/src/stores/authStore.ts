import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Role } from '@arifsmart/shared';

interface StaffUser {
  id: string;
  name: string;
  role: Role;
  branchId?: string;
}

interface AuthState {
  user: StaffUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: StaffUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Also set in legacy localStorage for non-Zustand parts if needed
        if (typeof window !== 'undefined') {
          localStorage.setItem('arifsmart_token', token);
          localStorage.setItem('arifsmart_user', JSON.stringify(user));
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('arifsmart_token');
          localStorage.removeItem('arifsmart_user');
        }
      },
    }),
    {
      name: 'arifsmart_auth_storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
