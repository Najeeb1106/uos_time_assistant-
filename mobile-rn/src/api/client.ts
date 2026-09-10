import axios from 'axios';
import { Config } from '../constants/Config';
import { getToken, removeToken } from '../utils/storage';

if (__DEV__) {
  console.log(`[API Client Initialized] Base URL: ${Config.API_URL}`);
}

export const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
apiClient.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
    }
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.log('[API Request Error]', error?.message);
    }
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null) {
  onUnauthorizedCallback = cb;
}

// Response Interceptor: Handle HTTP 401/403 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} from ${response.config?.url}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      console.log(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url} -> Status: ${error.response?.status} | Code: ${error.code} | Message: ${error.message}${serverMsg ? ` | Server: ${serverMsg}` : ''}`
      );
    }
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn(`[API Client] Session expired or invalid token (HTTP ${error.response.status}). Clearing auth session.`);
      await removeToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);
