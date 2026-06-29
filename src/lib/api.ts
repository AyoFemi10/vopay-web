import axios from 'axios';
import Cookies from 'js-cookie';

const normalizeApiUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || 'https://vopay-api-7f4903ec07cd.herokuapp.com');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh
        const { data } = await apiClient.post(
          '/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (data.success && data.data?.tokens?.accessToken) {
          const { accessToken, expiresIn } = data.data.tokens;
          
          // Save new access token
          Cookies.set('accessToken', accessToken, { 
            expires: expiresIn / 86400, // convert seconds to days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear token and let AuthContext handle redirect
        Cookies.remove('accessToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
