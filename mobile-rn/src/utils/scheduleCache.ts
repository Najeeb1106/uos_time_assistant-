import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassLecture } from '../models/Schedule';

const CACHE_KEY = 'sheduos_schedule_cache';

export interface CachedSchedulePayload {
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  cachedAt: string;
}

/**
 * Save schedule payload to local AsyncStorage cache
 */
export async function saveScheduleCache(payload: {
  classes: ClassLecture[];
  pdfFileName?: string | null;
  uploadedAt?: string | null;
}): Promise<void> {
  try {
    if (!payload.classes || !Array.isArray(payload.classes)) return;
    
    const cacheData: CachedSchedulePayload = {
      classes: payload.classes,
      pdfFileName: payload.pdfFileName || null,
      uploadedAt: payload.uploadedAt || null,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('[ScheduleCache] Error saving schedule cache:', error);
  }
}

/**
 * Retrieve cached schedule payload from AsyncStorage
 */
export async function loadScheduleCache(): Promise<CachedSchedulePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSchedulePayload;
  } catch (error) {
    console.error('[ScheduleCache] Error loading schedule cache:', error);
    return null;
  }
}

/**
 * Remove cached schedule payload
 */
export async function clearScheduleCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('[ScheduleCache] Error clearing schedule cache:', error);
  }
}
