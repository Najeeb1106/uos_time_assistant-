import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassLecture } from '../models/Schedule';

const GLOBAL_CACHE_KEY = 'sheduos_global_schedule_cache';

export interface CachedGlobalPayload {
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  cachedAt: string;
}

/**
 * Save global master timetable to AsyncStorage cache
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
    await AsyncStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('[FreeRoomCache] Error saving global schedule cache:', error);
  }
}

/**
 * Retrieve cached global master timetable from AsyncStorage
 */
export async function loadGlobalScheduleCache(): Promise<CachedGlobalPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(GLOBAL_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedGlobalPayload;
  } catch (error) {
    console.error('[FreeRoomCache] Error loading global schedule cache:', error);
    return null;
  }
}

/**
 * Clear cached global timetable
 */
export async function clearGlobalScheduleCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GLOBAL_CACHE_KEY);
  } catch (error) {
    console.error('[FreeRoomCache] Error clearing global schedule cache:', error);
  }
}
