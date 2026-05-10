import api from './client';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, v));
  return p.toString() ? `?${p}` : '';
};

export const leadsApi = {
  list: (params) => api.get(`/leads${qs(params)}`).then(r => r.data),
  board: () => api.get('/leads/board').then(r => r.data),
  get: (id) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data) => api.post('/leads', data).then(r => r.data),
  update: (id, data) => api.put(`/leads/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/leads/${id}`).then(r => r.data),
  convert: (id, data) => api.post(`/leads/${id}/convert`, data).then(r => r.data),
};

export const accountsApi = {
  list: (params) => api.get(`/accounts${qs(params)}`).then(r => r.data),
  get: (id) => api.get(`/accounts/${id}`).then(r => r.data),
  create: (data) => api.post('/accounts', data).then(r => r.data),
  update: (id, data) => api.put(`/accounts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/accounts/${id}`).then(r => r.data),
};

export const contactsApi = {
  list: (params) => api.get(`/contacts${qs(params)}`).then(r => r.data),
  get: (id) => api.get(`/contacts/${id}`).then(r => r.data),
  create: (data) => api.post('/contacts', data).then(r => r.data),
  update: (id, data) => api.put(`/contacts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/contacts/${id}`).then(r => r.data),
};

export const opportunitiesApi = {
  list: (params) => api.get(`/opportunities${qs(params)}`).then(r => r.data),
  funnel: () => api.get('/opportunities/funnel').then(r => r.data),
  get: (id) => api.get(`/opportunities/${id}`).then(r => r.data),
  create: (data) => api.post('/opportunities', data).then(r => r.data),
  update: (id, data) => api.put(`/opportunities/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/opportunities/${id}`).then(r => r.data),
  convert: (id, data) => api.post(`/opportunities/${id}/convert`, data).then(r => r.data),
};

export const activitiesApi = {
  list: (params) => api.get(`/activities${qs(params)}`).then(r => r.data),
  create: (data) => api.post('/activities', data).then(r => r.data),
  update: (id, data) => api.put(`/activities/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/activities/${id}`).then(r => r.data),
};
