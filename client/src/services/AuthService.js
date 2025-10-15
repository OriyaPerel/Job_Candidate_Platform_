import api from './api';

export async function loginApi(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  // צפי: data = { token, user: { _id, email, fullName } }
  return data;
}
