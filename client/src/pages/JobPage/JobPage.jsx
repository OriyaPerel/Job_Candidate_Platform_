import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; 
import { getJobById } from "../../services/JobService";
import styles from "./JobPage.module.css";
import { createApplication } from "../../services/ApplicationService";


export default function JobPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState("");

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
          setError("Failed to load the job");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  async function onApply() {
  if (applying) return;
  const jobId = job?._id || id;   
  console.log('[Apply] jobId =', jobId);
  if (!jobId) { setApplyError('Missing job id'); return; }

  setApplying(true);
  setApplyError('');
  try {
    await createApplication(jobId);
    setApplied(true);
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || 'Failed to apply';
    if (status === 409) setApplied(true);
    else setApplyError(msg);
  } finally {
    setApplying(false);
  }
}


  if (loading) return <div className={styles.form}><div className={styles.title}>Loading…</div></div>;
  if (error) return <div className={styles.form}><div className={styles.error}>{error}</div></div>;
  if (notFound) return <div className={styles.form}><div className={styles.title}>Job not found</div></div>;
  if (!job) return null;

  const years = Number.isFinite(job?.yearsOfExperienceRequired)
    ? job.yearsOfExperienceRequired
    : 0;

  const skills = Array.isArray(job?.skillsRequired)
    ? job.skillsRequired.filter(Boolean)
    : [];

  const postedByName =
    job?.postedBy?.fullName ||
    job?.postedBy?.name ||
    job?.postedBy?.email ||
    (typeof job?.postedBy === "string" ? job.postedBy : "-");

  const postedByEmail =
    (typeof job?.postedBy === "string" && job.postedBy.includes("@"))
      ? job.postedBy
      : job?.postedBy?.email || null;

  const profileHref = postedByEmail ? `/user/${encodeURIComponent(postedByEmail)}` : null;

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>{job?.position || "Job"}</h2>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label>Role</label>
          <div className={styles.value}>{job?.position || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Company</label>
          <div className={styles.value}>{job?.company || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Location</label>
          <div className={styles.value}>{job?.location || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Department</label>
          <div className={styles.value}>{job?.department || "-"}</div>
        </div>

        <div className={styles.field}>
          <label>Years of Experience</label>
          <div className={styles.value}>{years}</div>
        </div>

        <div className={styles.field}>
          <label>Posted by</label>
          <div className={`${styles.value} ${styles.mono} ${styles.break}`}>
            {profileHref ? (
              <Link to={profileHref} className={styles.link}>
                {postedByName}
              </Link>
            ) : (
              postedByName || "-"
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label>Posted at</label>
          <div className={styles.value}>
            {job?.createdAt
              ? new Date(job.createdAt).toLocaleDateString("he-IL")
              : "-"}
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label>Job Description</label>
        <div className={`${styles.box} ${styles.multiline}`}>
          {job?.description ? job.description : <div className={styles.placeholder}>—</div>}
        </div>
      </div>

      <div className={styles.field}>
        <label>Required Skills</label>
        <div className={styles.chips}>
          {skills.length
            ? skills.map((s, i) => <span className={styles.chip} key={`${s}-${i}`}>{s}</span>)
            : <span className={styles.value}>—</span>}
        </div>
      </div>

      
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={onApply}
          disabled={applying || applied}
          title={applied ? "Already applied" : "Apply to this job"}
        >
          {applied ? "Applied" : (applying ? "Applying…" : "Apply to this job")}
        </button>
        {applyError && <div className={styles.error}>{applyError}</div>}
      </div>
    </div>
  );
}
