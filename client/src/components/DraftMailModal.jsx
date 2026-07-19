import { useState, useEffect, useRef } from 'react';

export default function DraftMailModal({ job, onClose }) {
  const [copied, setCopied] = useState(null); // 'subject' | 'body' | 'all'
  const [userName, setUserName] = useState('');
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  const toEmail = job.apply_email;
  const subject = `Application for ${job.role} — ${job.company}`;
  const body = buildEmailBody(job, userName);

  const mailtoLink = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const fullEmail = `To: ${toEmail}\nSubject: ${subject}\n\n${body}`;

  return (
    <div className="modal-overlay" ref={modalRef} onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>📧 Draft Application Email</h2>
            <p className="modal-subtitle">
              {job.company} — {job.role}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Name input for personalization */}
        <div className="modal-field">
          <label className="modal-label">Your Name (optional)</label>
          <input
            className="modal-input"
            type="text"
            placeholder="Enter your name to personalize the email…"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {/* To */}
        <div className="modal-field">
          <label className="modal-label">To</label>
          <div className="modal-value-row">
            <code className="modal-value">{toEmail}</code>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleCopy(toEmail, 'to')}
            >
              {copied === 'to' ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Subject */}
        <div className="modal-field">
          <label className="modal-label">Subject</label>
          <div className="modal-value-row">
            <code className="modal-value">{subject}</code>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleCopy(subject, 'subject')}
            >
              {copied === 'subject' ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-field">
          <label className="modal-label">Email Body</label>
          <pre className="modal-body-preview">{body}</pre>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => handleCopy(body, 'body')}
            style={{ marginTop: '0.5rem' }}
          >
            {copied === 'body' ? '✓ Copied' : '📋 Copy Body'}
          </button>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <a
            href={mailtoLink}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            📨 Open in Mail App
          </a>
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy(fullEmail, 'all')}
          >
            {copied === 'all' ? '✓ All Copied!' : '📋 Copy Everything'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Email body generator ──────────────────────────────────────────────────

function buildEmailBody(job, userName) {
  const greeting = 'Dear Hiring Team,';
  const name = userName.trim() || '[Your Name]';
  const role = job.role || 'the advertised position';
  const company = job.company || 'your esteemed organization';

  const lines = [
    greeting,
    '',
    `I am writing to express my interest in the ${role} position at ${company}. I came across this opportunity through our college placement cell and would like to submit my application for your consideration.`,
    '',
    `Please find my resume/CV attached for your review. I am eager to contribute to ${company} and believe my skills and background align well with the requirements of this role.`,
    '',
  ];

  if (job.eligible_batches && job.eligible_batches.length > 0) {
    lines.push(`I am from the ${job.eligible_batches.join('/')} batch.`);
    lines.push('');
  }

  lines.push(
    'I would welcome the opportunity to discuss how I can contribute to your team. Please feel free to reach out at your convenience.',
    '',
    'Thank you for your time and consideration.',
    '',
    'Best regards,',
    name,
    '',
    '---',
    '⚠️ Remember to attach your CV/Resume before sending!',
  );

  return lines.join('\n');
}
