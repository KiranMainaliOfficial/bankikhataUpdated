export function money(value = 0) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}
