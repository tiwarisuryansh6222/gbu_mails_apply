import { useState, Fragment } from 'react';

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

export default function JobTable({ data, sortConfig, onSort, onDraftMail }) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Column order: #, Company, Role (description), Apply Link, Email/Draft, then the rest
  const columns = [
    { key: '_index', label: '#', sortable: false },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'role', label: 'Role / Description', sortable: true },
    { key: 'apply_link', label: 'Apply Link', sortable: false },
    { key: 'apply_email', label: 'Apply via Email', sortable: false },
    { key: 'work_mode', label: 'Mode', sortable: true },
    { key: 'employment_type', label: 'Type', sortable: true },
    { key: 'eligible_batches', label: 'Batches', sortable: true },
    { key: 'ctc_or_stipend', label: 'CTC / Stipend', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'deadline', label: 'Deadline', sortable: true },
  ];

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-wrapper">
      <table className="job-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                style={!col.sortable ? { cursor: 'default' } : undefined}
              >
                {col.label}
                {col.sortable && (
                  <span
                    className={`sort-icon ${sortConfig?.key === col.key ? 'active' : ''}`}
                  >
                    {getSortIcon(col.key)}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((job, i) => (
            <Fragment key={`job-${i}`}>
              <tr
                className={expandedRow === i ? 'expanded-row' : ''}
                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
              >
                {/* # */}
                <td className="row-index">{i + 1}</td>

                {/* Company */}
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {job.company}
                </td>

                {/* Role / Description */}
                <td style={{ color: 'var(--text-accent)', minWidth: '180px' }}>
                  {job.role}
                </td>

                {/* Apply Link */}
                <td>
                  {job.apply_link && job.apply_link !== 'not mentioned' ? (
                    isValidURL(job.apply_link) ? (
                      <a
                        className="job-card-link"
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.78rem' }}>{job.apply_link}</span>
                    )
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* Apply via Email / Draft Mail */}
                <td>
                  {hasApplyEmail(job) ? (
                    <button
                      className="btn btn-draft-mail btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDraftMail(job);
                      }}
                    >
                      ✉️ Draft Mail
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* Mode */}
                <td>
                  <span className={`badge badge-${job.work_mode}`}>{job.work_mode}</span>
                </td>

                {/* Type */}
                <td>
                  <span className={`badge badge-${job.employment_type}`}>
                    {job.employment_type}
                  </span>
                </td>

                {/* Batches */}
                <td>
                  {(job.eligible_batches || []).length > 0
                    ? job.eligible_batches.join(', ')
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>

                {/* CTC / Stipend */}
                <td>{job.ctc_or_stipend}</td>

                {/* Location */}
                <td>{job.location}</td>

                {/* Deadline */}
                <td>{job.deadline}</td>
              </tr>

              {expandedRow === i && job.raw_snippet && (
                <tr className="table-snippet-row">
                  <td colSpan={columns.length}>
                    <strong style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Original Text Snippet
                    </strong>
                    <pre style={{ marginTop: '0.35rem' }}>{job.raw_snippet}</pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
