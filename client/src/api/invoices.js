import api from './client';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, v));
  return p.toString() ? `?${p}` : '';
};

export const invoicesApi = {
  list: (params) => api.get(`/invoices${qs(params)}`).then(r => r.data),
  summary: () => api.get('/invoices/summary').then(r => r.data),
  get: (id) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data) => api.post('/invoices', data).then(r => r.data),
  update: (id, data) => api.put(`/invoices/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }).then(r => r.data),
  delete: (id) => api.delete(`/invoices/${id}`).then(r => r.data),
};
