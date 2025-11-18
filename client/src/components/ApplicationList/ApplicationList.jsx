import { Link } from "react-router-dom";
import styles from "./ApplicationList.module.css";

export default function ApplicationList({ applications, title = "My Applications" }) {
  if (!applications?.length) {
    return <div className={styles.placeholder}>No applications yet</div>;
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {applications.map((app) => (
          <li key={app._id} className={styles.item}>
            <Link to={`/jobs/${app.job?._id}`} className={styles.link}>
              {app.job?.position || "Unknown job"}
            </Link>
            <span className={styles.status}>{app.status || "Pending"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
