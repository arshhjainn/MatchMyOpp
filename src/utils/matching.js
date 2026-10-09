const FIELD_TAGS = {
  'computer science': ['Computer Science', 'AI / ML'],
  engineering: ['Engineering', 'Computer Science'],
  'business & management': ['Business', 'Entrepreneurship'],
  'medicine & health': ['Medicine'],
  law: ['Law', 'Social Sciences'],
  'arts & design': ['Arts', 'Design'],
  mathematics: ['Mathematics', 'Computer Science'],
  'social sciences': ['Social Sciences'],
}

const GOAL_CATEGORIES = {
  Scholarships: 'Scholarship',
  Internships: 'Internship',
  Hackathons: 'Hackathon',
  Research: 'Research',
  Competitions: 'Hackathon',
  Grants: 'Grant',
}

const normalize = value => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function matchingTags(profile) {
  const interests = [...(profile.interests ?? [])]
  const field = FIELD_TAGS[normalize(profile.fieldOfStudy)] ?? [profile.fieldOfStudy]
  return [...new Set([...interests, ...field].map(normalize).filter(Boolean))]
}

function checkEligibility(opportunity, profile) {
  const requirements = opportunity.eligibility.map(normalize)
  const year = normalize(profile.yearOfStudy)
  const highSchoolRequirement = requirements.some(item => item.includes('high school senior'))

  if (highSchoolRequirement && !year.includes('high school')) return 'not-eligible'

  const citizenshipRequirement = requirements.some(item => item.includes('citizen') || item.includes('permanent resident'))
  if (citizenshipRequirement) return 'check'

  const undergraduateRequirement = requirements.some(item => item.includes('undergraduate student'))
  if (undergraduateRequirement && (year.includes('masters') || year.includes('phd') || year.includes('graduate'))) return 'not-eligible'

  const designRequirement = requirements.some(item => item.includes('design or digital arts'))
  const designField = ['arts & design', 'design', 'arts'].includes(normalize(profile.fieldOfStudy))
  if (designRequirement && !designField) return 'not-eligible'

  return 'eligible'
}

export function personalizeOpportunities(opportunities, profile) {
  if (!profile) return opportunities.map(opportunity => ({
    ...opportunity,
    eligibilityStatus: opportunity.eligible ? 'eligible' : 'check',
    matchReasons: [],
  }))

  const tags = matchingTags(profile)
  const goalCategory = GOAL_CATEGORIES[profile.goal]

  return opportunities.map(opportunity => {
    const opportunityTags = opportunity.tags.map(normalize)
    const matchedTags = opportunityTags.filter(tag => tags.includes(tag))
    const fieldTags = (FIELD_TAGS[normalize(profile.fieldOfStudy)] ?? [profile.fieldOfStudy]).map(normalize)
    const fieldMatch = opportunityTags.some(tag => fieldTags.includes(tag))
    const goalMatch = opportunity.category === goalCategory
    const score = Math.min(99, Math.max(35, 50 + Math.min(matchedTags.length, 3) * 9 + (fieldMatch ? 12 : 0) + (goalMatch ? 13 : 0)))
    const matchReasons = []

    if (matchedTags.length) matchReasons.push(`Matches your interest in ${opportunity.tags.filter(tag => matchedTags.includes(normalize(tag))).slice(0, 2).join(' and ')}.`)
    if (fieldMatch) matchReasons.push(`Relevant to your field of study: ${profile.fieldOfStudy}.`)
    if (goalMatch) matchReasons.push(`Matches your goal to find ${profile.goal.toLowerCase()}.`)
    if (!matchReasons.length) matchReasons.push(`Explore a new area related to ${opportunity.category.toLowerCase()}.`)

    return {
      ...opportunity,
      matchScore: score,
      eligibilityStatus: checkEligibility(opportunity, profile),
      matchReasons,
    }
  })
}
