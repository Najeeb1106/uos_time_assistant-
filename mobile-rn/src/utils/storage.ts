import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'uos_mobile_token';

/**
 * Persist secure authentication JWT token
 */
export async function setToken(token: string): Promise<void> {
  try {
    if (__DEV__) {
      console.log(`[Storage] setToken called (token present: ${Boolean(token)})`);
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (__DEV__) {
      console.log('[Storage] setToken completed successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Storage] Error setting token in SecureStore:', error);
    }
  }
}

/**
 * Retrieve secure authentication JWT token
 */
export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (__DEV__) {
      console.log(`[Storage] getToken completed (stored token found: ${Boolean(token)})`);
    }
    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Storage] Error getting token from SecureStore:', error);
    }
    return null;
  }
}

/**
 * Delete secure authentication JWT token
 */
export async function removeToken(): Promise<void> {
  try {
    if (__DEV__) {
      console.log('[Storage] removeToken called');
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    if (__DEV__) {
      console.log('[Storage] removeToken completed successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Storage] Error deleting token from SecureStore:', error);
    }
  }
}

/**
 * Clear all authentication storage items
 */
export async function clearAuthStorage(): Promise<void> {
  await removeToken();
}

