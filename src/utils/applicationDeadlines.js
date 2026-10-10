import { daysUntil } from './dates'

export const deadlineGroups = [
  { id: 'today', label: 'Due today', description: 'Take action before the day ends.' },
  { id: 'three-days', label: 'Due within 3 days', description: 'These deadlines are coming up quickly.' },
  { id: 'seven-days', label: 'Due within 7 days', description: 'Plan your next step this week.' },
  { id: 'upcoming', label: 'Upcoming later', description: 'There is more time to prepare.' },
  { id: 'overdue', label: 'Overdue or expired', description: 'The listed deadline has passed.' },
  { id: 'unknown', label: 'Deadline not available', description: 'No deadline was provided by the backend.' },
]

const apiDeadlineGroups = {
  due_today: 'today',
  due_within_3_days: 'three-days',
  due_within_7_days: 'seven-days',
  upcoming_later: 'upcoming',
  overdue: 'overdue',
  deadline_unknown: 'unknown',
}

export function normalizeDeadlineGroup(group) {
  return apiDeadlineGroups[group] ?? group
}

export function getDeadlineGroup(deadline) {
  if (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return 'unknown'
  const parsed = new Date(`${deadline}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== deadline) return 'unknown'
  const days = daysUntil(deadline)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'three-days'
  if (days <= 7) return 'seven-days'
  return 'upcoming'
}

export function deadlineCountdown(deadline) {
  const group = getDeadlineGroup(deadline)
  if (group === 'unknown') return 'Deadline not listed'
  const days = daysUntil(deadline)
  if (days < 0) return `Passed ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
  if (days === 0) return 'Due today'
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}
