import { create } from 'zustand';
import { ClassLecture } from '../models/Schedule';
import { UserProfile } from '../models/User';
import { getCurrentScheduleApi } from '../api/scheduleApi';
import { loadScheduleCache, saveScheduleCache, clearScheduleCache } from '../utils/scheduleCache';
import {
  getScheduleProfileKey,
  filterClassesForUserProfile,
} from '../utils/builtinScheduleUtils';

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
  activeProfileKey: string | null;
  profileGeneration: number;

  // Actions
  fetchCurrentSchedule: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  loadCachedSchedule: () => Promise<boolean>;
  loadBuiltinSchedule: (customUser?: UserProfile | null) => void;
  syncWithUserProfile: (user: UserProfile | null | undefined) => void;
  clearSchedule: () => Promise<void>;
}

function getCurrentUserFromStore(): UserProfile | null {
  try {
    const { useMobileStore } = require('./useMobileStore');
    return useMobileStore?.getState?.()?.user || null;
  } catch {
    return null;
  }
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
  activeProfileKey: null,
  profileGeneration: 0,

  /**
   * Atomically synchronizes the schedule with the active user profile.
   * Clears stale data when user changes or logs out.
   */
  syncWithUserProfile: (user: UserProfile | null | undefined) => {
    const newGen = get().profileGeneration + 1;
    const profileKey = getScheduleProfileKey(user);

    if (!user) {
      set({
        classes: [],
        pdfFileName: null,
        uploadedAt: null,
        isBuiltin: false,
        isLoading: false,
        isRefreshing: false,
        isOffline: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        activeProfileKey: profileKey,
        profileGeneration: newGen,
      });
      clearScheduleCache().catch(() => {});
      return;
    }

    set({
      classes: [],
      pdfFileName: null,
      uploadedAt: null,
      isBuiltin: false,
      isLoading: false,
      isRefreshing: false,
      isOffline: false,
      error: null,
      lastUpdated: new Date().toISOString(),
      activeProfileKey: profileKey,
      profileGeneration: newGen,
    });
  },

  loadBuiltinSchedule: (customUser?: UserProfile | null) => {
    const user = customUser !== undefined ? customUser : getCurrentUserFromStore();
    get().syncWithUserProfile(user);
    get().fetchCurrentSchedule();
  },

  loadCachedSchedule: async () => {
    const user = getCurrentUserFromStore();
    const expectedProfileKey = getScheduleProfileKey(user);
    const cached = await loadScheduleCache(expectedProfileKey);

    if (cached && cached.classes && Array.isArray(cached.classes)) {
      // Validate that cached classes actually match the current user profile
      const validClasses = filterClassesForUserProfile(cached.classes, user);
      if (validClasses.length > 0) {
        set({
          classes: validClasses,
          pdfFileName: cached.pdfFileName,
          uploadedAt: cached.uploadedAt,
          isBuiltin: false,
          isOffline: true,
          activeProfileKey: expectedProfileKey,
          lastUpdated: cached.cachedAt,
        });
        return true;
      }
    }
    return false;
  },

  fetchCurrentSchedule: async () => {
    const currentUser = getCurrentUserFromStore();
    const currentProfileKey = getScheduleProfileKey(currentUser);
    const requestGen = get().profileGeneration;

    // 1. Attempt loading valid cache matching current profile
    await get().loadCachedSchedule();

    set({ isLoading: true, error: null });

    try {
      const response = await getCurrentScheduleApi();

      // Generation guard: If profile changed while network request was in flight, abort
      if (get().profileGeneration !== requestGen) {
        return;
      }

      const latestUser = getCurrentUserFromStore();
      const latestProfileKey = getScheduleProfileKey(latestUser);

      if (response.success && response.classes && Array.isArray(response.classes) && response.classes.length > 0) {
        // Strict filter: ensure classes from server belong to CURRENT profile (not old semester/batch)
        const matchingClasses = filterClassesForUserProfile(response.classes, latestUser);

        if (matchingClasses.length > 0) {
          const payload = {
            profileKey: latestProfileKey,
            classes: matchingClasses,
            pdfFileName: response.pdfFileName || null,
            uploadedAt: response.uploadedAt || null,
            isBuiltin: false,
          };

          await saveScheduleCache(payload);

          set({
            classes: matchingClasses,
            pdfFileName: response.pdfFileName || null,
            uploadedAt: response.uploadedAt || null,
            isBuiltin: false,
            isLoading: false,
            isOffline: false,
            error: null,
            activeProfileKey: latestProfileKey,
            lastUpdated: new Date().toISOString(),
          });
          return;
        }
      }

      // No matching schedule on server -> clear classes and show empty state
      set({
        classes: [],
        pdfFileName: null,
        uploadedAt: null,
        isBuiltin: false,
        isLoading: false,
        isOffline: false,
        error: null,
        activeProfileKey: latestProfileKey,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      // Generation guard
      if (get().profileGeneration !== requestGen) return;

      set({
        isLoading: false,
        isOffline: true,
        error: null,
      });
    }
  },

  refreshSchedule: async () => {
    const currentUser = getCurrentUserFromStore();
    const requestGen = get().profileGeneration;
    const profileKey = getScheduleProfileKey(currentUser);

    set({ isRefreshing: true, error: null });

    try {
      const response = await getCurrentScheduleApi();

      // Generation guard
      if (get().profileGeneration !== requestGen) return;

      const latestUser = getCurrentUserFromStore();
      const latestProfileKey = getScheduleProfileKey(latestUser);

      if (response.success && response.classes && Array.isArray(response.classes) && response.classes.length > 0) {
        const matchingClasses = filterClassesForUserProfile(response.classes, latestUser);

        if (matchingClasses.length > 0) {
          const payload = {
            profileKey: latestProfileKey,
            classes: matchingClasses,
            pdfFileName: response.pdfFileName || null,
            uploadedAt: response.uploadedAt || null,
            isBuiltin: false,
          };

          await saveScheduleCache(payload);

          set({
            classes: matchingClasses,
            pdfFileName: response.pdfFileName || null,
            uploadedAt: response.uploadedAt || null,
            isBuiltin: false,
            isRefreshing: false,
            isOffline: false,
            error: null,
            activeProfileKey: latestProfileKey,
            lastUpdated: new Date().toISOString(),
          });
          return;
        }
      }

      // No matching server schedule -> clear classes
      set({
        classes: [],
        pdfFileName: null,
        uploadedAt: null,
        isBuiltin: false,
        isRefreshing: false,
        isOffline: false,
        error: null,
        activeProfileKey: latestProfileKey,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      if (get().profileGeneration !== requestGen) return;
      set({ isRefreshing: false, isOffline: true });
    }
  },

  clearSchedule: async () => {
    await clearScheduleCache();
    const user = getCurrentUserFromStore();
    get().syncWithUserProfile(user);
  },
}));
