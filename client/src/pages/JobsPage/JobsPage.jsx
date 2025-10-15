import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/JobService";
import styles from "./JobsPage.module.css";
import { Link } from "react-router-dom";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAllJobs();
        setJobs(data.jobs); // או setJobs(data) אם החזרת רק את המערך
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h1>Jobs</h1>
      <div>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        <ul>
          {jobs.map((job) => (
            <li key={job._id}>
              <Link to={`/jobs/${job._id}`}>{job.position}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>);
}

