import { appStorage } from './appStorage';
import { ClassLecture } from '../models/Schedule';

const GLOBAL_CACHE_KEY = 'sheduos_global_schedule_cache';

export interface CachedGlobalPayload {
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  cachedAt: string;
}

/**
 * Save global master timetable to cache
 */
export async function saveGlobalScheduleCache(payload: {
  classes: ClassLecture[];
  pdfFileName?: string | null;
  uploadedAt?: string | null;
}): Promise<void> {
  try {
    if (!payload.classes || !Array.isArray(payload.classes)) return;

    const cacheData: CachedGlobalPayload = {
      classes: payload.classes,
      pdfFileName: payload.pdfFileName || null,
      uploadedAt: payload.uploadedAt || null,
      cachedAt: new Date().toISOString(),
    };
    await appStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    if (__DEV__) {
      console.warn('[FreeRoomCache] Error saving global schedule cache:', error);
    }
  }
}

/**
 * Retrieve cached global master timetable from cache
 */
export async function loadGlobalScheduleCache(): Promise<CachedGlobalPayload | null> {
  try {
    const raw = await appStorage.getItem(GLOBAL_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedGlobalPayload;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FreeRoomCache] Error loading global schedule cache:', error);
    }
    return null;
  }
}

/**
 * Clear cached global timetable
 */
export async function clearGlobalScheduleCache(): Promise<void> {
  try {
    await appStorage.removeItem(GLOBAL_CACHE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[FreeRoomCache] Error clearing global schedule cache:', error);
    }
  }
}

