import api from './client';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, v));
  return p.toString() ? `?${p}` : '';
};

export const usersApi = {
  list: (params) => api.get(`/users${qs(params)}`).then(r => r.data),
  get: (id) => api.get(`/users/${id}`).then(r => r.data),
  create: (data) => api.post('/users', data).then(r => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/users/${id}`).then(r => r.data),
  updateProfile: (data) => api.put('/users/me', data).then(r => r.data),
};

export const notificationsApi = {
  list: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
};
