import api from './client';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, v));
  return p.toString() ? `?${p}` : '';
};

export const tasksApi = {
  list: (params) => api.get(`/tasks${qs(params)}`).then(r => r.data),
  mine: () => api.get('/tasks/mine').then(r => r.data),
  get: (id) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
};
