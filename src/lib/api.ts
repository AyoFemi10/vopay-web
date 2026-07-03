import axios from 'axios';
import { supabase } from '@/lib/supabase';

const normalizeApiUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || 'https://api.vopayx.qzz.io/api'
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
  async (config) => {
    // Attach the Supabase access token from the active session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token && config.headers) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // X-Profile-ID — read lazily to avoid circular import at module load time
    try {
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
// Supabase handles token refresh automatically via the SDK.
// On 401, we trigger a manual session refresh and retry once.
let isRefreshing = false;
type FailedQueueItem = {
  resolve: (value: void) => void;
  reject: (reason: unknown) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
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
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(async () => {
          // Re-read the session after refresh completes
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !data.session) {
        throw refreshError ?? new Error('Session refresh failed');
      }

      originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      // Clear auth state and redirect to login
      await supabase.auth.signOut();

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
