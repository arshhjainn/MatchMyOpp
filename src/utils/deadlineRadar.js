export function deadlineDate(deadline) {
  if (!deadline) return null
  const date = new Date(`${String(deadline).slice(0, 10)}T23:59:59`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function deadlineDays(deadline, now = new Date()) {
  const date = deadlineDate(deadline)
  if (!date) return null
  return Math.ceil((date.getTime() - now.getTime()) / 86400000)
}

export function deadlineGroup(deadline, now = new Date()) {
  const days = deadlineDays(deadline, now)
  if (days === null) return 'unknown'
  if (days < 0) return 'closed'
  if (days <= 3) return 'closing'
  if (days <= 7) return 'week'
  return 'upcoming'
}

export function deadlineLabel(deadline, now = new Date()) {
  const days = deadlineDays(deadline, now)
  if (days === null) return 'Deadline not listed'
  if (days < 0) return `Closed ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export function deadlineGroupLabel(group) {
  return ({ closing: 'Closing soon', week: 'Due this week', upcoming: 'Upcoming', unknown: 'Deadline unknown', closed: 'Closed / expired' })[group] ?? group
}
