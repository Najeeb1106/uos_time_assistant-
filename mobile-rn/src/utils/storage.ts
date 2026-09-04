import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'uos_mobile_token';

/**
 * Persist secure authentication JWT token
 */
export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('[Storage] Error setting secure token:', error);
  }
}

/**
 * Retrieve secure authentication JWT token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[Storage] Error getting secure token:', error);
    return null;
  }
}

/**
 * Delete secure authentication JWT token
 */
export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[Storage] Error removing secure token:', error);
  }
}

/**
 * Clear all authentication storage items
 */
export async function clearAuthStorage(): Promise<void> {
  await removeToken();
}
