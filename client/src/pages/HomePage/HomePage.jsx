import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllJobs } from '../../services/JobService';
import styles from './Home.module.css';
import AskAIButton from "../../components/ApplicationList/AiAssistant/AskAIButton";
import JobsList from '../../components/ApplicationList/JobsList/JobsList';

export default function HomePage({ onOpenAI }) {
  const [jobs, setJobs] = useState([]);

  const profilePath = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user?.email) return `/user/${encodeURIComponent(user.email)}`;
    } catch {}
    return '/login';
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllJobs();
        setJobs(Array.isArray(data) ? data : (data.jobs || []));
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.headline}>WELCOME TO CANDIDATE APP</h1>

      <div className={styles.content}>
        <div className={styles.jobsBox}>
          <h2>Available Jobs</h2>
          {jobs.length === 0 ? (
            <p>No jobs available</p>
          ) : (
            <JobsList jobs={jobs} limit={4} showSeeAll={true} />
          )}
        </div>

        <div className={styles.rightBoxes}>
          <Link to="/create-job" className={styles.smallBox}>
            Add New Job
          </Link>
          <Link to={profilePath} className={styles.smallBox}>
            Profile
          </Link>
          <div className={styles.smallBox}>More Features</div>

          <div className={styles.smallBox}>
            <AskAIButton label="Ask AI" onOpen={onOpenAI} />
          </div>
        </div>
      </div>
    </div>
  );
}
