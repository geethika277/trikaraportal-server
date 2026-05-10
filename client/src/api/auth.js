import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: () => api.post('/auth/refresh').then(r => r.data),
  changePassword: (data) => api.put('/auth/change-password', data).then(r => r.data),
};
