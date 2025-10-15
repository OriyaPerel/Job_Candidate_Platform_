import api from './api';

export const createJob = (payload) =>
  api.post('/jobs', payload).then(r => r.data);

export const getAllJobs = async () => {
  const { data } = await api.get('/jobs');
  return data;
};

export const getJobById = (id, { signal } = {}) =>
  api.get(`/jobs/${id}`, { signal }).then(r => r.data);
