import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map<string, string>();
let isAsyncStorageWorking: boolean | null = null;

/**
 * Universal app storage helper that transparently uses AsyncStorage,
 * falling back to SecureStore and in-memory storage if AsyncStorage's
 * native module is unavailable in the current runtime environment.
 */
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isAsyncStorageWorking !== false) {
      try {
        const val = await AsyncStorage.getItem(key);
        isAsyncStorageWorking = true;
        if (val !== null) return val;
      } catch {
        isAsyncStorageWorking = false;
      }
    }

    try {
      const secureVal = await SecureStore.getItemAsync(key);
      if (secureVal !== null) return secureVal;
    } catch {
      // SecureStore key missing or failed
    }

    return memoryFallback.get(key) || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryFallback.set(key, value);

    if (isAsyncStorageWorking !== false) {
      try {
        await AsyncStorage.setItem(key, value);
        isAsyncStorageWorking = true;
        return;
      } catch {
        isAsyncStorageWorking = false;
      }
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Memory fallback is already updated
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryFallback.delete(key);

    if (isAsyncStorageWorking !== false) {
      try {
        await AsyncStorage.removeItem(key);
        isAsyncStorageWorking = true;
      } catch {
        isAsyncStorageWorking = false;
      }
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Memory fallback is already cleared
    }
  },
};

export default appStorage;
