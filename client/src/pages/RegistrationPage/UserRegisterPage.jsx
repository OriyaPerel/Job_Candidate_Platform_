import { useState } from 'react';
import { createUser } from '../../services/UserService';
import styles from './UserRegisterPage.module.css';  

export default function UserRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    role: '',
    email: '',
    phone: '',
    password: '',   
    skills: '',
    yearsExperience: '', 
    about: '',
    joblookingFor: ''
  });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === 'yearsExperience') {
      const onlyDigits = value.replace(/\D/g, '');
      setForm(p => ({ ...p, yearsExperience: onlyDigits }));
      return;
    }

    setForm(p => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const payload = {
        fullName: form.fullName,
        role: form.role,
        email: form.email,
        phone: form.phone,
        password: form.password,  
        ...(form.role !== 'recruiter' && {
          yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : 0,
          about: form.about,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          jobsLookingFor: form.joblookingFor.split(',').map(s => s.trim()).filter(Boolean),
        }),
      };

      await createUser(payload);

      setStatus({ loading: false, error: '', success: 'User registered successfully 🎉' });
      setForm({
        fullName: '',
        role: '',
        email: '',
        phone: '',
        password: '',
        skills: '',
        yearsExperience: '',
        about: '',
        joblookingFor: ''
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error occurred while submitting';
      setStatus({ loading: false, error: msg, success: '' });
    }
  };

  const isRecruiter = form.role === 'recruiter';

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h1 className={styles.title}>Registration Form</h1>

      <label>Full Name</label>
      <input name="fullName" value={form.fullName} onChange={onChange} required />

      <label>Role</label>
      <select name="role" value={form.role} onChange={onChange} required>
        <option value="" disabled>Choose role</option>
        <option value="candidate">candidate</option>
        <option value="recruiter">recruiter</option>
      </select>

      <label>Email</label>
      <input name="email" type="email" value={form.email} onChange={onChange} required />

      <label>Phone</label>
      <input name="phone" value={form.phone} onChange={onChange} />

      <label>Password</label>
      <input name="password" type="password" value={form.password} onChange={onChange} required />

      {!isRecruiter && (
        <>
          <label>Skills</label>
          <input
            name="skills"
            placeholder="React, Node, Mongo"
            value={form.skills}
            onChange={onChange}
          />

          <label>Years of experience</label>
          <input
            name="yearsExperience"
            pattern="[0-9]*"
            value={form.yearsExperience}
            onChange={onChange}
          />

          <label>Jobs looking for</label>
          <input
            name="joblookingFor"
            placeholder="Frontend Developer, Backend Developer"
            value={form.joblookingFor}
            onChange={onChange}
          />

          <label>About you</label>
          <textarea
            name="about"
            rows={3}
            value={form.about}
            onChange={onChange}
          />
        </>
      )}

      <button type="submit" className={styles.button} disabled={status.loading}>
        {status.loading ? 'Sending...' : 'Register'}
      </button>

      {status.error && <div className={styles.error}>{status.error}</div>}
      {status.success && <div className={styles.success}>{status.success}</div>}
    </form>
  );
}
