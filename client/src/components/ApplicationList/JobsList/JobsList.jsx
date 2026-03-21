import { Link } from 'react-router-dom';
import styles from './JobsList.module.css';

export default function JobsList({ jobs, limit, showSeeAll = false }) {
  const jobsToShow = limit ? jobs.slice(0, limit) : jobs;

  return (
    <ul className={styles.list}>
      {jobsToShow.map((job) => (
        <li key={job._id} className={styles.item}>
          <Link to={`/jobs/${job._id}`} className={styles.link}>
            {job.title || job.position || '(No title)'}
          </Link>
        </li>
      ))}

      {showSeeAll && (
        <li className={styles.seeAllItem}>
          <Link to="/jobs" className={styles.seeAllLink}>
            See all jobs →
          </Link>
        </li>
      )}
    </ul>
  );
}