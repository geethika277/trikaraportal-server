import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true
});
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/refresh') {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true })
          .then(r => {
            useAuthStore.getState().setAuth(r.data.user, r.data.accessToken);
            return r.data.accessToken;
          })
          .catch(() => {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
            return null;
          })
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
