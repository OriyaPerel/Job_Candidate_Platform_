// src/pages/JobPage/JobPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJobById } from "../../services/JobService";
import styles from "./JobPage.module.css";

export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        setNotFound(false);

        const data = await getJobById(id, { signal: ac.signal });
        const j = data?.job ?? data ?? null;

        if (!j) {
          setNotFound(true);
          setJob(null);
        } else {
          setJob(j);
        }
      } catch (err) {
        const status = err?.response?.status;
        const canceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED";
        if (canceled) return;

        if (status === 404) {
          setNotFound(true);
          setJob(null);
          setError("");
        } else {
          setError("לא הצלחתי לטעון את המשרה");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  // ---- שלבי תצוגה מוקדמים: לא נחשב נגזרות לפני שיש job ----
  if (loading) return <div className={styles.form}><div className={styles.title}>טוען…</div></div>;
  if (error) return <div className={styles.form}><div className={styles.error}>{error}</div></div>;
  if (notFound) return <div className={styles.form}><div className={styles.title}>המשרה לא נמצאה</div></div>;
  if (!job) return null;

  // ---- מכאן בטוח שיש job, או משתמשים ב-?. ----
  const years = Number.isFinite(job?.yearsOfExperienceRequired)
    ? job.yearsOfExperienceRequired
    : 0;

  const skills = Array.isArray(job?.skillsRequired)
    ? job.skillsRequired.filter(Boolean)
    : [];

  const postedAt = job?.postedAt
    ? new Date(job.postedAt).toLocaleString("he-IL", { dateStyle: "short" })
    : "-";

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>{job?.position || "משרה"}</h2>

      <section className={styles.grid2}>
        <div className={styles.field}>
          <label>תפקיד</label>
          <div className={styles.value}>{job?.position || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>חברה</label>
          <div className={styles.value}>{job?.company || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>מיקום</label>
          <div className={styles.value}>{job?.location || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>מחלקה</label>
          <div className={styles.value}>{job?.department || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>שנות ניסיון נדרשות</label>
          <div className={styles.value}>{years}</div>
        </div>

        <div className={styles.field}>
          <label>מזהה מפרסם</label>
          <div className={`${styles.value} ${styles.mono} ${styles.break}`}>
            {job?.postedBy || "-"}
          </div>
        </div>

        <div className={styles.field}>
          <label>פורסם בתאריך</label>
          <div className={styles.value}>
            {job?.createdAt ? new Date(job.createdAt).toLocaleDateString("he-IL") : "-"}
          </div>
        </div>
      </section>

      <div className={styles.field}>
        <label>תיאור המשרה</label>
        <div className={`${styles.box} ${styles.multiline}`}>
          {job?.description ? job.description : <div className={styles.placeholder}>—</div>}
        </div>
      </div>

      <div className={styles.field}>
        <label>כישורים נדרשים</label>
        <div className={styles.chips}>
          {skills.length
            ? skills.map((s, i) => <span className={styles.chip} key={`${s}-${i}`}>{s}</span>)
            : <span className={styles.value}>—</span>}
        </div>
      </div>
    </div>
  );
}
