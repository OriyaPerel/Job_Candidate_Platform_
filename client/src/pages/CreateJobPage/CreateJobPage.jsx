import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createJob } from '../../services/JobService';
import styles from './CreateJobPage.module.css';

export default function CreateJobPage() {
  const { userId: userIdFromUrl } = useParams();

  
  const userId = useMemo(() => {
    if (userIdFromUrl) return userIdFromUrl;
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return u?._id || null;
    } catch {
      return null;
    }
  }, [userIdFromUrl]);

  const [form, setForm] = useState({
    position: '',
    description: '',
    yearsOfExperienceRequired: '',
    skillsRequired: '',
    department: '',
    location: '',
  });

  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.loading) return;

    
    const position = form.position.trim();
    const description = form.description.trim();
    if (!userId) {
      setStatus({ loading: false, error: 'Missing userId (no URL param and no logged-in user).', success: '' });
      return;
    }
    if (!position || !description) {
      setStatus({ loading: false, error: 'position and description are required.', success: '' });
      return;
    }

    setStatus({ loading: true, error: '', success: '' });
    try {
      const payload = {
        position,
        description,
        yearsOfExperienceRequired:
          form.yearsOfExperienceRequired !== '' && !Number.isNaN(Number(form.yearsOfExperienceRequired))
            ? Number(form.yearsOfExperienceRequired)
            : 0,
        skillsRequired: form.skillsRequired
          ? form.skillsRequired
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        department: form.department.trim() || undefined,
        location: form.location.trim() || undefined,
      };
await createJob(payload);
     

      setStatus({ loading: false, error: '', success: 'Job created successfully 🎉' });
      setForm({
        position: '',
        description: '',
        yearsOfExperienceRequired: '',
        skillsRequired: '',
        department: '',
        location: '',
      });
    } catch (error) {
      
      const apiMsg = error?.response?.data?.message || error?.message || 'Failed to create job.';
      const apiDetail =
        error?.response?.data?.detail ||
        error?.response?.data?.details ||
        '';
      setStatus({
        loading: false,
        error: apiDetail ? `${apiMsg}: ${JSON.stringify(apiDetail)}` : apiMsg,
        success: '',
      });
      
      console.error('[CreateJob] error:', error?.response?.data || error);
    }
  };

  const missingUserId = !userId;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h1 className={styles.title}>Create New Job</h1>

      {missingUserId && (
        <div className={styles.error} style={{ marginBottom: 12 }}>
          Can’t find userId. Open this page via “Create Job” link (which includes your ID), or make sure you’re logged in.
        </div>
      )}

      <label>Position</label>
      <input
        name="position"
        value={form.position}
        onChange={onChange}
        required
        placeholder="e.g., Fullstack Developer"
      />

      <label>Description</label>
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        required
        rows={4}
        placeholder="Short role description..."
      />

      <label>Years of Experience</label>
      <input
        name="yearsOfExperienceRequired"
        value={form.yearsOfExperienceRequired}
        onChange={onChange}
        type="number"
        min="0"
        step="1"
        placeholder="0"
      />

      <label>Skills (comma separated)</label>
      <input
        name="skillsRequired"
        value={form.skillsRequired}
        onChange={onChange}
        placeholder="React, Node.js, MongoDB"
      />

      <label>Department</label>
      <input
        name="department"
        value={form.department}
        onChange={onChange}
        placeholder="R&D"
      />

      <label>Location</label>
      <input
        name="location"
        value={form.location}
        onChange={onChange}
        placeholder="Tel Aviv"
      />

      <button
        type="submit"
        className={styles.button}
        disabled={status.loading || missingUserId}
        title={missingUserId ? 'Missing userId' : 'Submit'}
      >
        {status.loading ? 'Sending...' : 'Create'}
      </button>

      {status.error && <div className={styles.error}>{status.error}</div>}
      {status.success && <div className={styles.success}>{status.success}</div>}
    </form>
  );
}
