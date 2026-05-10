import api from './client';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, v));
  return p.toString() ? `?${p}` : '';
};

export const projectsApi = {
  list: (params) => api.get(`/projects${qs(params)}`).then(r => r.data),
  get: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
  addTeam: (id, data) => api.post(`/projects/${id}/team`, data).then(r => r.data),
  removeTeam: (id, userId) => api.delete(`/projects/${id}/team/${userId}`).then(r => r.data),
  updateEnv: (id, envName, data) => api.put(`/projects/${id}/environments/${envName}`, data).then(r => r.data),
  listRepos: (id) => api.get(`/projects/${id}/repos`).then(r => r.data),
  addRepo: (id, data) => api.post(`/projects/${id}/repos`, data).then(r => r.data),
  updateRepo: (projectId, repoId, data) => api.put(`/projects/${projectId}/repos/${repoId}`, data).then(r => r.data),
  deleteRepo: (projectId, repoId) => api.delete(`/projects/${projectId}/repos/${repoId}`).then(r => r.data),
  syncRepo: (projectId, repoId) => api.post(`/projects/${projectId}/repos/${repoId}/sync`).then(r => r.data),
  listGithubRepos: (token) => api.get(`/projects/github/repos?token=${token}`).then(r => r.data),
  listIssues: (id, params) => api.get(`/projects/${id}/issues${qs(params)}`).then(r => r.data),
  issuesBoard: (id) => api.get(`/projects/${id}/issues/board`).then(r => r.data),
  getIssue: (projectId, issueId) => api.get(`/projects/${projectId}/issues/${issueId}`).then(r => r.data),
  updateIssue: (projectId, issueId, data) => api.put(`/projects/${projectId}/issues/${issueId}`, data).then(r => r.data),
  myIssues: () => api.get('/projects/my-issues').then(r => r.data),
};
