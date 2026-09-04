import { create } from 'zustand';
import { ClassLecture } from '../models/Schedule';
import { UserProfile } from '../models/User';
import { getCurrentScheduleApi } from '../api/scheduleApi';
import { loadScheduleCache, saveScheduleCache, clearScheduleCache } from '../utils/scheduleCache';
import {
  getBuiltinClassesForUser,
  BUILTIN_TIMETABLE_NAME,
  BUILTIN_TIMETABLE_UPLOADED_AT,
} from '../utils/builtinScheduleUtils';
import { useMobileStore } from './useMobileStore';

interface ScheduleState {
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  isBuiltin: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchCurrentSchedule: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  loadCachedSchedule: () => Promise<boolean>;
  loadBuiltinSchedule: (customUser?: UserProfile | null) => void;
  clearSchedule: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  classes: [],
  pdfFileName: null,
  uploadedAt: null,
  isBuiltin: false,
  isLoading: false,
  isRefreshing: false,
  isOffline: false,
  error: null,
  lastUpdated: null,

  loadBuiltinSchedule: (customUser?: UserProfile | null) => {
    const user = customUser !== undefined ? customUser : useMobileStore.getState().user;
    const builtinClasses = getBuiltinClassesForUser(user);
    set({
      classes: builtinClasses,
      pdfFileName: BUILTIN_TIMETABLE_NAME,
      uploadedAt: BUILTIN_TIMETABLE_UPLOADED_AT,
      isBuiltin: true,
      isLoading: false,
      isRefreshing: false,
      isOffline: false,
      error: null,
      lastUpdated: new Date().toISOString(),
    });

    // Save active built-in dataset to local storage cache for offline support
    saveScheduleCache({
      classes: builtinClasses,
      pdfFileName: BUILTIN_TIMETABLE_NAME,
      uploadedAt: BUILTIN_TIMETABLE_UPLOADED_AT,
    }).catch(() => {});
  },

  loadCachedSchedule: async () => {
    const cached = await loadScheduleCache();
    if (cached && cached.classes && cached.classes.length > 0) {
      // If cached file was a user-uploaded PDF, load it
      if (cached.pdfFileName !== BUILTIN_TIMETABLE_NAME) {
        set({
          classes: cached.classes,
          pdfFileName: cached.pdfFileName,
          uploadedAt: cached.uploadedAt,
          isBuiltin: false,
          isOffline: true,
          lastUpdated: cached.cachedAt,
        });
        return true;
      }
    }
    return false;
  },

  fetchCurrentSchedule: async () => {
    // 1. Attempt loading custom user-uploaded cached schedule first
    const hasCustomUploadCache = await get().loadCachedSchedule();

    if (!hasCustomUploadCache) {
      // Load built-in schedule matching the current profile immediately
      get().loadBuiltinSchedule();
    }

    set({ isLoading: true, error: null });
    try {
      const response = await getCurrentScheduleApi();
      if (response.success && response.classes && response.classes.length > 0) {
        // User has a personal uploaded custom schedule on server
        const payload = {
          classes: response.classes,
          pdfFileName: response.pdfFileName || null,
          uploadedAt: response.uploadedAt || null,
        };

        await saveScheduleCache(payload);

        set({
          classes: response.classes,
          pdfFileName: response.pdfFileName || null,
          uploadedAt: response.uploadedAt || null,
          isBuiltin: false,
          isLoading: false,
          isOffline: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        // No custom upload on server -> Re-align with built-in dataset for active profile
        get().loadBuiltinSchedule();
      }
    } catch (err: any) {
      // Network offline or fetch error -> Ensure built-in dataset matches current profile
      if (!get().classes || get().classes.length === 0 || get().isBuiltin) {
        get().loadBuiltinSchedule();
      } else {
        set({
          isLoading: false,
          isOffline: true,
          error: null,
        });
      }
    }
  },

  refreshSchedule: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const response = await getCurrentScheduleApi();
      if (response.success && response.classes && response.classes.length > 0) {
        const payload = {
          classes: response.classes,
          pdfFileName: response.pdfFileName || null,
          uploadedAt: response.uploadedAt || null,
        };

        await saveScheduleCache(payload);

        set({
          classes: response.classes,
          pdfFileName: response.pdfFileName || null,
          uploadedAt: response.uploadedAt || null,
          isBuiltin: false,
          isRefreshing: false,
          isOffline: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        // No custom schedule -> Refresh built-in data for current active profile
        get().loadBuiltinSchedule();
      }
    } catch (err: any) {
      get().loadBuiltinSchedule();
      set({ isRefreshing: false, isOffline: true });
    }
  },

  clearSchedule: async () => {
    await clearScheduleCache();
    get().loadBuiltinSchedule();
  },
}));
