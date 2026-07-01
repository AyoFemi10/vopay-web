import axios from 'axios';
import Cookies from 'js-cookie';

const normalizeApiUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL ||
    'https://vopay-api-7f4903ec07cd.herokuapp.com/api'
);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Authorization
    const token = Cookies.get('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // X-Profile-ID — read lazily to avoid circular import at module load time
    try {
      // Dynamic import of the store so this file is not a hard dep on zustand at load time
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useProfileStore } = require('@/stores/profileStore');
      const activeProfile = useProfileStore.getState().activeProfile;
      if (activeProfile?.id && config.headers) {
        config.headers['X-Profile-ID'] = activeProfile.id;
      }
    } catch {
      // store not available (e.g., SSR) — skip
    }

    // X-Device-Fingerprint — lightweight browser fingerprint
    if (typeof window !== 'undefined' && config.headers) {
      const fp = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset(),
      ].join('|');
      config.headers['X-Device-Fingerprint'] = btoa(fp).slice(0, 64);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
// Track whether we're already in the middle of a refresh to prevent loops
let isRefreshing = false;
type FailedQueueItem = {
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      if (data.success && data.data?.tokens?.accessToken) {
        const { accessToken, expiresIn } = data.data.tokens;

        Cookies.set('accessToken', accessToken, {
          expires: expiresIn / 86400,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        // Update authStore if available
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useAuthStore } = require('@/stores/authStore');
          const store = useAuthStore.getState();
          if (store.user) {
            store.setAuth(store.user, accessToken);
          }
        } catch {
          // ok if store not ready
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      }

      throw new Error('Refresh token response invalid');
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Second 401 — clear auth and redirect to login
      Cookies.remove('accessToken');
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('@/stores/authStore');
        useAuthStore.getState().clearAuth();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useProfileStore } = require('@/stores/profileStore');
        useProfileStore.getState().clearProfiles();
      } catch {
        // ok
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
