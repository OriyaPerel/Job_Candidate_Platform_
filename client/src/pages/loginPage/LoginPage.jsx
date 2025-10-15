import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './LoginPage.module.css';

// בסיס אחיד ל־API: תמיד כולל /api ומוריד סלאש סופי אם צריך
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api').replace(/\/$/, '');

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const canSubmit = email.trim() !== '' && password !== '' && !loading;

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErr('');
    setLoading(true);

    try {
      const payload = { email: email.trim(), password };

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // להשתמש רק אם עובדים עם httpOnly cookie
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 400 ? 'Missing email or password' :
           res.status === 401 ? 'Email or password is incorrect' :
           res.status === 404 ? 'User not found' :
           `Login failed (${res.status})`);
        setErr(msg);
        return;
      }

      // ✅ שמירת הטוקן והמשתמש – זה מה שמאפשר לכל שאר הבקשות “להכיר” אותך
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user)  localStorage.setItem('user', JSON.stringify(data.user));

      // עדכון גלובלי ל־UI
      window.dispatchEvent(new Event('authChanged'));

      // ✅ רידיירקט חכם: חוזרים ליעד שביקשו במקור, או לדף הבית
      const redirectTo = location.state?.redirectTo || '/';
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign In</h1>

        <form onSubmit={handleEmailPasswordLogin} className={styles.form} noValidate>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />

          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
          />

          <button type="submit" className={styles.primaryBtn} disabled={!canSubmit}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {err && (
          <p className={styles.error} role="alert" aria-live="assertive">
            {err}
          </p>
        )}

        <p className={styles.bottomText}>
          Don&apos;t have an account? <Link to="/register-user">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
