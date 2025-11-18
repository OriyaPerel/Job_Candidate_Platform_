import api from './api';

export async function createJob(payload) {
  const { data } = await api.post('/jobs', payload);
  return data;
}

export async function getAllJobs() {
  const { data } = await api.get('/jobs');
  return data;
}

export async function getJobById(id, { signal } = {}) {
  const { data } = await api.get(`/jobs/${id}`, { signal });
  return data;
}
