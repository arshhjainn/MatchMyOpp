export function formatDeadline(date) {
  if (!date) return 'Not listed'
  const value = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(value.getTime()) ? String(date) : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(value)
}

export function daysUntil(date) {
  if (!date) return Number.POSITIVE_INFINITY
  return Math.ceil((new Date(`${date}T00:00:00Z`) - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000)
}
