import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignInRequest, SignUpRequest, UserProfile } from '@right-trade/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi, meApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { setAuthToken } from '../api/tokenHolder';

interface AuthState {
  token: string | null;
  user: (UserProfile & { paperBalance?: number }) | null;
  hasHydrated: boolean;
  isSubmitting: boolean;
  error: string | null;
  signUp: (input: SignUpRequest) => Promise<boolean>;
  signIn: (input: SignInRequest) => Promise<boolean>;
  signOut: () => void;
  acceptRiskDisclaimer: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      isSubmitting: false,
      error: null,

      signUp: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const { user, tokens } = await authApi.signUp(input);
          setAuthToken(tokens.accessToken);
          set({ token: tokens.accessToken, user, isSubmitting: false });
          return true;
        } catch (err) {
          set({ isSubmitting: false, error: err instanceof ApiError ? err.message : 'Sign up failed.' });
          return false;
        }
      },

      signIn: async (input) => {
        set({ isSubmitting: true, error: null });
        try {
          const { user, tokens } = await authApi.signIn(input);
          setAuthToken(tokens.accessToken);
          set({ token: tokens.accessToken, user, isSubmitting: false });
          return true;
        } catch (err) {
          set({ isSubmitting: false, error: err instanceof ApiError ? err.message : 'Sign in failed.' });
          return false;
        }
      },

      signOut: () => {
        setAuthToken(null);
        set({ token: null, user: null });
      },

      acceptRiskDisclaimer: async () => {
        const user = await meApi.acceptRiskDisclaimer();
        set({ user });
      },

      refreshProfile: async () => {
        if (!get().token) return;
        try {
          const user = await meApi.get();
          set({ user });
        } catch {
          // token may have expired — sign the user out so they land back on the auth flow
          get().signOut();
        }
      },

      clearError: () => set({ error: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'right-trade-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
        state?.setHasHydrated(true);
      },
    },
  ),
);
