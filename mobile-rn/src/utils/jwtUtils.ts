/**
 * JWT Utility functions for ShedUOS Mobile
 */

/**
 * Decodes base64url string safely across all React Native JavaScript runtimes
 */
export function decodeBase64(input: string): string {
  try {
    let str = input.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    if (typeof atob === 'function') {
      try {
        return decodeURIComponent(
          atob(str)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        return atob(str);
      }
    }
    // Fallback base64 decoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    str = String(str).replace(/=+$/, '');
    for (
      let bc = 0, bs = 0, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  } catch {
    return '';
  }
}

/**
 * Parses payload section of a standard JWT token
 */
export function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const decodedStr = decodeBase64(parts[1]);
    if (!decodedStr) return null;
    return JSON.parse(decodedStr);
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT token is expired (or missing/invalid)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const payload = parseJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      return false;
    }
    // exp is in seconds, Date.now() is in ms. Buffer by 5 seconds
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
}
