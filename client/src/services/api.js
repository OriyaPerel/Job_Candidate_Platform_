import axios from 'axios';

// ✅ ודאי שזו כתובת ה-API הנכונה של השרת שלך
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false, // ❌ אל תשתמשי בזה אם את לא עובדת עם cookies (JWT לא דורש את זה)
});

// ✅ לפני כל בקשה, נוסיף את ה-token אם הוא קיים
api.interceptors.request.use((config) => {
  try {
    // נשלוף את הטוקן מה-localStorage
    const token = localStorage.getItem('token');
    
    // נוסיף אותו ל-Headers רק אם קיים
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (err) {
    console.error('Error adding token to headers:', err);
    return config;
  }
});

export default api;
