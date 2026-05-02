import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Role } from '@/shared/types';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Matches the shape returned by POST /api/auth/pin-login → user object.
 * branchId is at the top level AND nested under branch.id for compatibility.
 */
interface StaffUser {
  id: string;
  name: string;
  email?: string;
  role: Role;
  /** Direct branchId — populated after the auth.service.ts fix */
  branchId?: string;
  /** Nested branch object from the DB join */
  branch?: { id: string; name: string };
}

interface AuthState {
  user: StaffUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: StaffUser, token: string) => void;
  logout: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Mirror to plain localStorage so non-Zustand consumers (e.g. socket auth callback)
        // can read the token without importing the store
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

// ── Selector helpers ───────────────────────────────────────────────────────

/**
 * Returns the resolved branchId for the current user, checking both locations.
 * Use this instead of duplicating the ?? chain everywhere.
 */
export function selectBranchId(user: StaffUser | null): string {
  return (
    user?.branchId ??
    user?.branch?.id ??
    ''
  );
}
