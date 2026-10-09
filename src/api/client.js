const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://matchmyopp-1.onrender.com').replace(/\/+$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE_URL}. Check that it is online and allows this frontend in CORS.`)
  }

  const text = await response.text()
  let payload = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = text }
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload ? payload.detail : null
    const message = Array.isArray(detail) ? detail.map(item => item.msg).join(', ') : detail
    const error = new Error(message || `API request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return payload
}

function unwrapList(payload, keys) {
  if (Array.isArray(payload)) return payload
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key]
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const asArray = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : []
const asStrings = value => asArray(value).map(item => typeof item === 'string' ? item : item?.reason ?? item?.description ?? item?.text ?? '').filter(Boolean)

export function normalizeProfile(profile) {
  if (!profile) return null
  const name = profile.name ?? [profile.first_name ?? profile.firstName, profile.last_name ?? profile.lastName].filter(Boolean).join(' ')
  return {
    ...profile,
    student_id: profile.student_id ?? profile.studentId ?? profile.id,
    name,
    age: profile.age ?? '',
    grade: profile.grade ?? profile.year ?? profile.year_of_study ?? profile.year_grade ?? '',
    location: profile.location ?? '',
    skills: asArray(profile.skills),
    interests: asArray(profile.interests),
  }
}

export function normalizeOpportunity(item) {
  item = item?.opportunity ?? item
  const id = item.opportunity_id ?? item.id
  const status = item.eligibility_status ?? item.eligibilityStatus
  return {
    ...item,
    id,
    title: item.title ?? 'Untitled opportunity',
    organization: item.organization ?? item.organizer ?? item.provider ?? '',
    category: item.category ?? 'Opportunity',
    description: item.description ?? '',
    tags: asArray(item.required_skills ?? item.requiredSkills ?? item.skills ?? item.tags),
    requiredSkills: asArray(item.required_skills ?? item.requiredSkills ?? item.skills ?? item.tags),
    eligibleGrades: asArray(item.eligible_grades ?? item.eligibleGrades),
    minAge: item.min_age ?? item.minAge ?? null,
    maxAge: item.max_age ?? item.maxAge ?? null,
    location: item.location ?? 'Location not specified',
    deadline: item.deadline ?? null,
    amount: item.reward ?? item.amount ?? 'See details',
    applicationUrl: item.application_url ?? item.applicationUrl ?? item.url ?? '',
    matchScore: item.match_score ?? item.matchScore ?? item.score ?? 0,
    matchReasons: asStrings(item.match_reasons ?? item.matchReasons ?? item.reasons),
    eligibilityStatus: typeof status === 'boolean' ? (status ? 'eligible' : 'not-eligible') : status ?? ((item.is_eligible ?? item.eligible) === false ? 'not-eligible' : 'eligible'),
    featured: item.featured ?? item.badge ?? 'Recommended',
    imageUrl: item.image_url ?? item.imageUrl ?? item.image ?? '',
  }
}

export function normalizeApplication(item) {
  item = item?.application ?? item
  const opportunity = item.opportunity ?? {}
  return {
    ...item,
    id: item.application_id ?? item.id,
    opportunityId: item.opportunity_id ?? item.opportunityId ?? opportunity.opportunity_id ?? opportunity.id,
    opportunityTitle: item.opportunity_title ?? item.opportunityTitle ?? item.title ?? opportunity.title ?? 'Opportunity',
    status: item.status ?? 'Interested',
    notes: item.notes ?? '',
    deadline: item.deadline ?? opportunity.deadline ?? null,
    applicationUrl: item.application_url ?? item.applicationUrl ?? opportunity.application_url ?? '',
  }
}

export const api = {
  health: () => request('/api/health'),
  getProfile: async studentId => {
    const payload = await request(`/api/profile/${encodeURIComponent(studentId)}`)
    return normalizeProfile(payload?.profile ?? payload?.student ?? payload)
  },
  saveProfile: async profile => {
    const payload = await request('/api/profile', { method: 'POST', body: JSON.stringify(profile) })
    const returned = payload?.profile ?? payload?.student ?? payload
    return normalizeProfile({ ...profile, ...(returned ?? {}) })
  },
  getOpportunities: async studentId => {
    const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''
    return unwrapList(await request(`/api/opportunities${query}`), ['opportunities', 'items', 'results', 'eligible_opportunities']).map(item => normalizeOpportunity(item.opportunity ?? item))
  },
  getOpportunity: async opportunityId => {
    const payload = await request(`/api/opportunities/${encodeURIComponent(opportunityId)}`)
    return normalizeOpportunity(payload?.opportunity ?? payload)
  },
  createOpportunity: payload => request('/api/opportunities', { method: 'POST', body: JSON.stringify(payload) }),
  saveSwipe: (studentId, opportunityId, action) => request('/api/swipes', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, opportunity_id: opportunityId, action }),
  }),
  getSaved: async studentId => unwrapList(await request(`/api/saved/${encodeURIComponent(studentId)}`), ['opportunities', 'saved', 'saved_opportunities', 'items']).map(item => normalizeOpportunity(item.opportunity ?? item)),
  getApplications: async studentId => unwrapList(await request(`/api/applications/${encodeURIComponent(studentId)}`), ['applications', 'items']).map(normalizeApplication),
  addApplication: async (studentId, opportunityId, notes = '') => {
    const payload = await request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, opportunity_id: opportunityId, status: 'Interested', notes }),
    })
    return normalizeApplication({
      ...payload,
      application_id: payload?.application_id ?? payload?.id,
      opportunity_id: payload?.opportunity_id ?? opportunityId,
      status: payload?.status ?? 'Interested',
      notes: payload?.notes ?? notes,
    })
  },
  updateApplication: async (applicationId, changes) => {
    const payload = await request(`/api/applications/${encodeURIComponent(applicationId)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    })
    return normalizeApplication({ ...payload, ...changes, application_id: payload?.application_id ?? applicationId })
  },
}
