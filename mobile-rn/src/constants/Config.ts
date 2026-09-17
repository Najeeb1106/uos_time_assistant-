function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  // Fallback: confirmed production HTTPS endpoint (no private IPs)
  const rawUrl = envUrl || 'https://uos-time-assistant.onrender.com/api';
  // Strip trailing slashes
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  // If caller provided a bare host without /api suffix, append it
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
}

export const Config = {
  APP_NAME: 'ShedUOS',
  API_URL: getApiUrl(),
  TIMEOUT: 15000,
  VERSION: '1.1.5',
};
