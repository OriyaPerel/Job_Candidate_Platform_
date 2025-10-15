import api from './api';

export const createUser = (payload) =>
  api.post('/users/register', payload).then(r => r.data);

export const getUserByEmail = (email) =>
  api.get(`/users/${encodeURIComponent(email)}`).then(r => r.data);
