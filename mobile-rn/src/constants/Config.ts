function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  // On physical Android devices in release mode, localhost is unreachable without USB reverse port forwarding.
  // Fallback to confirmed production HTTPS endpoint when localhost is passed into release build or when unset.
  const isLocalHost = envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'));
  const rawUrl = (!__DEV__ && isLocalHost) || !envUrl
    ? 'https://uos-time-assistant.onrender.com/api'
    : envUrl;
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
  TIMEOUT: 45000,
  VERSION: '1.1.7',
};

