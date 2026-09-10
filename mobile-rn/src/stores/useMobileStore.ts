import { create } from 'zustand';
import { UserProfile } from '../models/User';
import { getToken, setToken, removeToken } from '../utils/storage';
import { isTokenExpired } from '../utils/jwtUtils';
import { setOnUnauthorizedCallback } from '../api/client';
import { loginApi, registerApi, getCurrentUserApi, LoginPayload, RegisterPayload } from '../api/authApi';
import { updateProfileApi } from '../api/profileApi';
import { Config } from '../constants/Config';
import { appStorage } from '../utils/appStorage';
import { normalizeBatch } from '../utils/builtinScheduleUtils';
import axios from 'axios';

const AVATAR_STORAGE_KEY = 'sheduos_user_avatar_uri';
const USER_STORAGE_KEY = 'sheduos_cached_user';

interface MobileAuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authInitialized: boolean;
  error: string | null;

  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: any) => Promise<void>;
  setAvatar: (uri: string | null) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

function formatApiError(err: any, fallbackMessage: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.error) {
      return err.response.data.error;
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to connect to server. Please check your internet connection and try again.';
    }
    if (err.message) {
      return err.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallbackMessage;
}

function syncScheduleStore(user: UserProfile | null | undefined): void {
  try {
    const { useScheduleStore } = require('./useScheduleStore');
    const scheduleState = useScheduleStore?.getState?.();
    if (scheduleState?.syncWithUserProfile) {
      scheduleState.syncWithUserProfile(user);
    }
  } catch {
    // ignore
  }
}

export const useMobileStore = create<MobileAuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    if (__DEV__) {
      console.log('[Auth] initializeAuth started');
    }
    set({ isLoading: true, error: null });
    try {
      const storedToken = await getToken();
      if (__DEV__) {
        console.log(`[Auth] stored token found: ${Boolean(storedToken)}`);
      }

      const cachedAvatar = await appStorage.getItem(AVATAR_STORAGE_KEY).catch(() => null);
      const cachedUserJson = await appStorage.getItem(USER_STORAGE_KEY).catch(() => null);
      let cachedUser: UserProfile | null = null;
      if (cachedUserJson) {
        try {
          cachedUser = JSON.parse(cachedUserJson);
        } catch {
          cachedUser = null;
        }
      }

      if (__DEV__) {
        console.log(`[Auth] cached user found: ${Boolean(cachedUser)}`);
      }

      if (!storedToken) {
        if (__DEV__) {
          console.log('[Auth] No stored token found. Auth initialized as unauthenticated.');
          console.log('[Auth] authInitialized set: true, isAuthenticated set: false');
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true,
          isLoading: false,
          error: null,
        });
        syncScheduleStore(null);
        return;
      }

      const expired = isTokenExpired(storedToken);
      if (__DEV__) {
        console.log(`[Auth] token expired: ${expired}`);
      }

      if (expired) {
        if (__DEV__) {
          console.log('[Auth] Stored token is expired. Clearing storage.');
          console.log('[Auth] authInitialized set: true, isAuthenticated set: false');
        }
        await removeToken();
        await appStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true,
          isLoading: false,
          error: null,
        });
        syncScheduleStore(null);
        return;
      }

      // Token exists and is not expired: immediately restore authenticated session
      const initialUser = cachedUser ? { ...cachedUser, avatarUri: cachedAvatar || undefined } : null;
      if (__DEV__) {
        console.log('[Auth] Valid unexpired token found. Restoring authenticated session.');
        console.log('[Auth] authInitialized set: true, isAuthenticated set: true');
      }
      set({
        token: storedToken,
        user: initialUser,
        isAuthenticated: true,
        authInitialized: true,
        isLoading: false,
        error: null,
      });

      // Synchronize schedule store immediately with initial restored profile
      syncScheduleStore(initialUser);

      // Background validation & fresh user profile sync (offline errors ignored)
      try {
        const response = await getCurrentUserApi();
        if (response.success && response.user) {
          const freshUser = { ...response.user, avatarUri: cachedAvatar || undefined };
          await appStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)).catch(() => {});
          set({ user: freshUser });
          syncScheduleStore(freshUser);
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          // Token explicitly rejected by backend (e.g. revoked or user removed)
          if (__DEV__) {
            console.warn('[Auth] Stored token rejected by server with 401/403. Clearing session.');
          }
          await removeToken();
          await appStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
          });
          syncScheduleStore(null);
        }
        // Network errors or backend offline are ignored so valid sessions remain authenticated offline
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[Auth] Unexpected error during initializeAuth:', err);
      }
      set({
        authInitialized: true,
        isLoading: false,
        error: null,
      });
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginApi(payload);
      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || 'Login failed. Please check your credentials.');
      }

      if (__DEV__) {
        console.log('[Auth] Login successful. Saving token and user to storage.');
      }
      await setToken(response.token);
      await appStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)).catch(() => {});
      const cachedAvatar = await appStorage.getItem(AVATAR_STORAGE_KEY).catch(() => null);
      const userProfile = { ...response.user, avatarUri: cachedAvatar || undefined };
      set({
        token: response.token,
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncScheduleStore(userProfile);
    } catch (err: any) {
      const errorMessage = formatApiError(err, 'An unexpected error occurred during login.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await registerApi(payload);
      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || 'Registration failed. User may already exist.');
      }

      await setToken(response.token);
      await appStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)).catch(() => {});
      set({
        token: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      syncScheduleStore(response.user);
    } catch (err: any) {
      const errorMessage = formatApiError(err, 'An unexpected error occurred during registration.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setAvatar: async (uri: string | null) => {
    try {
      if (uri) {
        await appStorage.setItem(AVATAR_STORAGE_KEY, uri);
      } else {
        await appStorage.removeItem(AVATAR_STORAGE_KEY);
      }
      set((state) => ({
        user: state.user ? { ...state.user, avatarUri: uri || undefined } : null,
      }));
    } catch {
      // ignore
    }
  },

  updateProfile: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      // Semester-change validation: Batch MUST be changed as well when Semester is changed
      const currentUser = get().user;
      if (currentUser && currentUser.role !== 'teacher' && payload.semester !== undefined && payload.batch !== undefined) {
        const prevSem = Number(currentUser.semester);
        const newSem = Number(payload.semester);
        const prevBatch = normalizeBatch(currentUser.batch);
        const newBatch = normalizeBatch(payload.batch);

        if (prevSem > 0 && newSem > 0 && newSem !== prevSem && newBatch === prevBatch) {
          const errorMsg = 'Please change your batch/session as well when changing the semester.';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      }

      const avatarUri = payload.avatarUri;
      const cleanPayload = { ...payload };
      delete cleanPayload.avatarUri;

      const response = await updateProfileApi(cleanPayload);
      if (!response.success || !response.user) {
        throw new Error(response.message || 'Failed to update profile.');
      }

      if (avatarUri !== undefined) {
        if (avatarUri) {
          await appStorage.setItem(AVATAR_STORAGE_KEY, avatarUri).catch(() => {});
        } else {
          await appStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {});
        }
      }

      const updatedUser = {
        ...get().user,
        ...response.user,
        avatarUri: avatarUri !== undefined ? (avatarUri || undefined) : get().user?.avatarUri,
      };

      await appStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser)).catch(() => {});

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });

      // Synchronize schedule store with the updated profile immediately
      syncScheduleStore(updatedUser);
    } catch (err: any) {
      const errorMessage = formatApiError(err, 'An unexpected error occurred while updating profile.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await removeToken();
    await appStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    try {
      const { useScheduleStore } = require('./useScheduleStore');
      useScheduleStore?.getState?.()?.clearSchedule?.();
    } catch {
      // ignore
    }
  },
}));

// Bind global API 401/403 unauthorized event to automatic store reset
setOnUnauthorizedCallback(() => {
  useMobileStore.getState().logout();
});
