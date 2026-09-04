import { create } from 'zustand';
import { UserProfile } from '../models/User';
import { getToken, setToken, removeToken } from '../utils/storage';
import { loginApi, registerApi, getCurrentUserApi, LoginPayload, RegisterPayload } from '../api/authApi';
import { updateProfileApi } from '../api/profileApi';
import { Config } from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AVATAR_STORAGE_KEY = 'sheduos_user_avatar_uri';

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
      const cleanServerHost = Config.API_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return `Unable to connect to server. Please ensure your device is connected to the same Wi-Fi network as the server (${cleanServerHost}).`;
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

export const useMobileStore = create<MobileAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedToken = await getToken();
      const cachedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY).catch(() => null);

      if (!storedToken) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authInitialized: true,
          isLoading: false,
        });
        return;
      }

      // Token exists, validate with GET /api/auth/me
      try {
        const response = await getCurrentUserApi();
        if (response.success && response.user) {
          set({
            token: storedToken,
            user: { ...response.user, avatarUri: cachedAvatar || undefined },
            isAuthenticated: true,
            authInitialized: true,
            isLoading: false,
          });
        } else {
          await removeToken();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            authInitialized: true,
            isLoading: false,
          });
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          // Token explicitly invalid
          await removeToken();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            authInitialized: true,
            isLoading: false,
          });
        } else {
          // Network error or backend offline: preserve token so user isn't logged out
          set({
            token: storedToken,
            isAuthenticated: true,
            authInitialized: true,
            isLoading: false,
          });
        }
      }
    } catch (err) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        authInitialized: true,
        isLoading: false,
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

      await setToken(response.token);
      const cachedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY).catch(() => null);
      set({
        token: response.token,
        user: { ...response.user, avatarUri: cachedAvatar || undefined },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
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
      set({
        token: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const errorMessage = formatApiError(err, 'An unexpected error occurred during registration.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setAvatar: async (uri: string | null) => {
    try {
      if (uri) {
        await AsyncStorage.setItem(AVATAR_STORAGE_KEY, uri);
      } else {
        await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
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
      const avatarUri = payload.avatarUri;
      const cleanPayload = { ...payload };
      delete cleanPayload.avatarUri;

      const response = await updateProfileApi(cleanPayload);
      if (!response.success || !response.user) {
        throw new Error(response.message || 'Failed to update profile.');
      }

      if (avatarUri !== undefined) {
        if (avatarUri) {
          await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarUri).catch(() => {});
        } else {
          await AsyncStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {});
        }
      }

      set((state) => {
        const finalAvatar = avatarUri !== undefined ? (avatarUri || undefined) : state.user?.avatarUri;
        return {
          user: { ...state.user, ...response.user, avatarUri: finalAvatar },
          isLoading: false,
          error: null,
        };
      });
    } catch (err: any) {
      const errorMessage = formatApiError(err, 'An unexpected error occurred while updating profile.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await removeToken();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));
