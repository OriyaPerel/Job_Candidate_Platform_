import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserByEmail } from "../../services/UserService";
import { getMyApplications } from "../../services/ApplicationService";
import ApplicationList from "../../components/ApplicationList/ApplicationList";
import styles from "./UserPage.module.css";

export default function UserPage() {
  const { email } = useParams();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) return;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const userData = await getUserByEmail(email, { signal: ac.signal });
        setUser(userData || null);

        const myApps = await getMyApplications();
        setApplications(myApps || []);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setUser(null);
          setError("");
        } else if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setError("could not load user data");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [email]);

  if (loading)
    return (
      <div className={styles.form}>
        <div className={styles.title}>טוען…</div>
      </div>
    );

  if (error)
    return (
      <div className={styles.form}>
        <div className={styles.error}>{error}</div>
      </div>
    );

  if (!user)
    return (
      <div className={styles.form}>
        <div className={styles.title}>לא נמצא משתמש</div>
      </div>
    );

  const skills = Array.isArray(user.skills) ? user.skills.filter(Boolean) : [];
  const years = Number.isFinite(user.yearsExperience) ? user.yearsExperience : 0;
  const jobsLookingFor = Array.isArray(user.jobsLookingFor)
    ? user.jobsLookingFor.filter(Boolean)
    : [];
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleString("he-IL", { dateStyle: "short" })
    : "-";

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>{user.fullName}'s Profile</h2>

      <section className={styles.grid2}>
        <div className={styles.field}>
          <label>Name</label>
          <div className={styles.value}>{user.fullName || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Email</label>
          <div className={`${styles.value} ${styles.mono} ${styles.break}`}>
            {user.email}
          </div>
        </div>

        <div className={styles.field}>
          <label>Phone number</label>
          <div className={styles.value}>{user.phone || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Years of experience</label>
          <div className={styles.value}>{years}</div>
        </div>
      </section>

      {/* ===== Jobs user is looking for ===== */}
      <div className={styles.field}>
        <label>Jobs {user.fullName} is looking for</label>
        <div className={styles.box}>
          {jobsLookingFor.length ? (
            <span>{jobsLookingFor.join(", ")}</span>
          ) : (
            <div className={styles.placeholder}>—</div>
          )}
        </div>
      </div>

      {/* ===== Skills ===== */}
      <div className={styles.field}>
        <label>Skills</label>
        <div className={styles.chips}>
          {skills.length ? (
            skills.map((s, i) => (
              <span className={styles.chip} key={`${s}-${i}`}>
                {s}
              </span>
            ))
          ) : (
            <span className={styles.value}>—</span>
          )}
        </div>
      </div>

      {/* ===== About ===== */}
      <div className={styles.field}>
        <label>About</label>
        <div className={`${styles.value} ${styles.multiline}`}>
          {user.about || "-"}
        </div>
      </div>

      {/* ===== My Applications ===== */}
      <div className={styles.field}>
        <div className={styles.box}>
          <ApplicationList applications={applications} />
        </div>
      </div>
    </div>
  );
}
