import api from './api';

export async function createUser(payload) {
  const { data } = await api.post('/users/register', payload);
  return data;
}
export async function getUserByEmail(email) {
  const { data } = await api.get(`/users/${encodeURIComponent(email)}`);
  return data;
}
