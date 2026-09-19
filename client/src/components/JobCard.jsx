import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Bookmark, Check } from 'lucide-react';

function WorkModeBadge({ mode }) {
  return <span className={`badge badge-${mode}`}>{mode}</span>;
}

function EmploymentBadge({ type }) {
  return <span className={`badge badge-${type}`}>{type}</span>;
}

function isValidURL(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasApplyEmail(job) {
  return job.apply_email && job.apply_email !== 'not mentioned';
}

export default function JobCard({ job, style, onDraftMail }) {
  const [expanded, setExpanded] = useState(false);
  const { currentUser } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  const handleTrack = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert("Please login to track applications.");
      return;
    }
    setTracking(true);
    try {
      await addDoc(collection(db, 'applications'), {
        userId: currentUser.uid,
        company: job.company || 'Unknown',
        role: job.role || 'Unknown',
        appliedAt: new Date().toISOString(),
        statuses: {
          applied: true,
          test_given: false,
          interview_round: false,
          hr_round: false,
          placed: false
        },
        jobDetails: job // keeping a reference of other details
      });
      setTracked(true);
    } catch (error) {
      console.error("Error saving tracking info: ", error);
      alert("Failed to track application.");
    } finally {
      setTracking(false);
    }
  };

  return (
    <article
      className={`job-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
      style={style}
    >
      <div className="job-card-header">
        <div>
          <div className="job-card-company">{job.company}</div>
          <div className="job-card-role">{job.role}</div>
        </div>
        <WorkModeBadge mode={job.work_mode} />
      </div>

      <div className="job-card-details">
        <EmploymentBadge type={job.employment_type} />
        {(job.eligible_batches || []).map((b) => (
          <span key={b} className="badge badge-batch">{b}</span>
        ))}
      </div>

      <div className="job-card-row">
        <span className="label">💰 CTC</span>
        <span>{job.ctc_or_stipend}</span>
      </div>

      {job.location && job.location !== 'not mentioned' && (
        <div className="job-card-row">
          <span className="label">📍 Location</span>
          <span>{job.location}</span>
        </div>
      )}

      {job.deadline && job.deadline !== 'not mentioned' && (
        <div className="job-card-row">
          <span className="label">📅 Deadline</span>
          <span>{job.deadline}</span>
        </div>
      )}

      {job.apply_link && job.apply_link !== 'not mentioned' && (
        <div className="job-card-row">
          <span className="label">🔗 Apply</span>
          {isValidURL(job.apply_link) ? (
            <a
              className="job-card-link"
              href={job.apply_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {job.apply_link}
            </a>
          ) : (
            <span>{job.apply_link}</span>
          )}
        </div>
      )}

      {hasApplyEmail(job) && (
        <div className="job-card-row">
          <span className="label">📧 Email</span>
          <span>{job.apply_email}</span>
        </div>
      )}

      <div className="job-card-actions">
        <button
          className={`primary-btn ${tracked ? 'tracked' : ''}`}
          onClick={handleTrack}
          disabled={tracking || tracked}
        >
          {tracked ? (
            <><Check size={16} /> Tracked</>
          ) : (
            <><Bookmark size={16} /> {tracking ? 'Tracking…' : 'Track'}</>
          )}
        </button>

        {hasApplyEmail(job) && (
          <button
            className="btn btn-draft-mail"
            onClick={(e) => {
              e.stopPropagation();
              onDraftMail(job);
            }}
          >
            ✉️ Draft Mail
          </button>
        )}
      </div>

      {expanded && job.raw_snippet && (
        <div className="job-card-snippet">
          <div className="snippet-title">Original Text Snippet</div>
          <pre>{job.raw_snippet}</pre>
        </div>
      )}
    </article>
  );
}
