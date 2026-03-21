import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/HomePage/HomePage';
import UserRegisterPage from './pages/RegistrationPage/UserRegisterPage';
import LoginPage from './pages/loginPage/LoginPage';
import styles from './styles/App.module.css';
import CreateJobPage from './pages/CreateJobPage/CreateJobPage';
import UserPage from './pages/UserPage/UserPage';
import JobsPage from './pages/JobsPage/JobsPage';
import JobPage from './pages/JobPage/JobPage';
import AiChatPanel from './components/ApplicationList/AiAssistant/AiChatPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

function AppInner() {
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem('token'));
  const [aiOpen, setAiOpen] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem('token'));
  }, [location]);

  useEffect(() => {
    const onAuthChanged = () => setIsAuthed(!!localStorage.getItem('token'));
    window.addEventListener('authChanged', onAuthChanged);
    return () => window.removeEventListener('authChanged', onAuthChanged);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChanged'));
    window.location.href = '/login';
  };

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <nav className={styles.appNav}>
          <Link to="/register-user" className={styles.appLink}>Registration form</Link>

          {isAuthed && <Link to="/create-job" className={styles.appLink}>Create Job</Link>}

          {isAuthed ? (
            <>
              <Link to="/" className={styles.appLink}>Home</Link>
              {user?.email && (
                <Link to={`/user/${encodeURIComponent(user.email)}`} className={styles.appLink}>
                  Profile
                </Link>
              )}
              <Link to="/jobs" className={styles.appLink}>Jobs</Link>
              <button
                onClick={handleLogout}
                className={styles.appLink}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.appLink}>Login</Link>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        <Routes>
          <Route
            path="/"
            element={isAuthed ? <Home onOpenAI={() => setAiOpen(true)} /> : <Navigate to="/login" replace />}
          />
          <Route path="/register-user" element={<UserRegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-job" element={isAuthed ? <CreateJobPage /> : <Navigate to="/login" replace />} />
          <Route path="/user/:email" element={<UserPage />} />
          <Route path="/users/:userId/jobs/new" element={<CreateJobPage />} />
          <Route path="/jobs" element={isAuthed ? <JobsPage /> : <Navigate to="/login" replace />} />
          <Route path="/jobs/:id" element={isAuthed ? <JobPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={isAuthed ? "/" : "/login"} replace />} />
        </Routes>
      </main>

      <AiChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
