import { appStorage } from './appStorage';
import { ClassLecture } from '../models/Schedule';

const CACHE_KEY = 'sheduos_schedule_cache';

export interface CachedSchedulePayload {
  profileKey?: string;
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  isBuiltin?: boolean;
  cachedAt: string;
}

/**
 * Save schedule payload to local cache with profile signature
 */
export async function saveScheduleCache(payload: {
  profileKey?: string;
  classes: ClassLecture[];
  pdfFileName?: string | null;
  uploadedAt?: string | null;
  isBuiltin?: boolean;
}): Promise<void> {
  try {
    if (!payload.classes || !Array.isArray(payload.classes)) return;
    
    const cacheData: CachedSchedulePayload = {
      profileKey: payload.profileKey,
      classes: payload.classes,
      pdfFileName: payload.pdfFileName || null,
      uploadedAt: payload.uploadedAt || null,
      isBuiltin: payload.isBuiltin ?? false,
      cachedAt: new Date().toISOString(),
    };
    await appStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    if (__DEV__) {
      console.warn('[ScheduleCache] Error saving schedule cache:', error);
    }
  }
}

/**
 * Retrieve cached schedule payload from cache.
 * If expectedProfileKey is provided, returns null if cached data belongs to a different profile.
 */
export async function loadScheduleCache(expectedProfileKey?: string): Promise<CachedSchedulePayload | null> {
  try {
    const raw = await appStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedSchedulePayload;

    if (expectedProfileKey && data.profileKey && data.profileKey !== expectedProfileKey) {
      if (__DEV__) {
        console.log(`[ScheduleCache] Profile key mismatch (cached: ${data.profileKey}, expected: ${expectedProfileKey}). Discarding cache.`);
      }
      return null;
    }
    return data;
  } catch (error) {
    if (__DEV__) {
      console.warn('[ScheduleCache] Error loading schedule cache:', error);
    }
    return null;
  }
}

/**
 * Remove cached schedule payload
 */
export async function clearScheduleCache(): Promise<void> {
  try {
    await appStorage.removeItem(CACHE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[ScheduleCache] Error clearing schedule cache:', error);
    }
  }
}
