/**
 * Convert an array of job objects to a CSV string and trigger download.
 */
export function exportToCSV(data, filename = 'placement_results.csv') {
  if (!data || data.length === 0) return;

  const headers = [
    'Company',
    'Role',
    'Work Mode',
    'Eligible Batches',
    'Employment Type',
    'CTC / Stipend',
    'Location',
    'Deadline',
    'Apply Link',
    'Apply Email',
  ];

  const escapeCSV = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((job) => [
    escapeCSV(job.company),
    escapeCSV(job.role),
    escapeCSV(job.work_mode),
    escapeCSV((job.eligible_batches || []).join(', ')),
    escapeCSV(job.employment_type),
    escapeCSV(job.ctc_or_stipend),
    escapeCSV(job.location),
    escapeCSV(job.deadline),
    escapeCSV(job.apply_link),
    escapeCSV(job.apply_email),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
