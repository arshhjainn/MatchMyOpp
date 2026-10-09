const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const values = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : []
const unique = list => [...new Set(list.map(normalize).filter(Boolean))]

function gradeMatches(studentGrade, eligibleGrades) {
  const grade = normalize(studentGrade)
  const allowed = values(eligibleGrades).map(normalize)
  if (!grade || !allowed.length) return null
  const undergraduate = /undergraduate|bachelor|[1-4](st|nd|rd|th) year/.test(grade)
  const graduate = /graduate|master|phd|doctoral/.test(grade)
  return allowed.some(item => item === grade || (undergraduate && /undergraduate|college|university/.test(item)) || (graduate && /graduate|master|phd|doctoral/.test(item)))
}

function textOverlap(profileValues, opportunityValues) {
  const profileTerms = unique(values(profileValues))
  const requiredTerms = unique(values(opportunityValues))
  if (!requiredTerms.length || !profileTerms.length) return { available: false, value: 0, matched: [], missing: requiredTerms }
  const matched = requiredTerms.filter(required => profileTerms.some(candidate => candidate === required || candidate.includes(required) || required.includes(candidate)))
  return { available: true, value: Math.round(matched.length / requiredTerms.length * 100), matched, missing: requiredTerms.filter(term => !matched.includes(term)) }
}

export function scoreOpportunity(opportunity, profile) {
  const requiredSkills = values(opportunity.requiredSkills ?? opportunity.required_skills ?? opportunity.tags ?? opportunity.skills)
  const skills = textOverlap(profile?.skills, requiredSkills)
  const interests = textOverlap(profile?.interests, opportunity.tags ?? opportunity.interests ?? requiredSkills)
  const grade = gradeMatches(profile?.grade ?? profile?.year, opportunity.eligibleGrades ?? opportunity.eligible_grades)
  const requiredExperience = values(opportunity.requiredExperience ?? opportunity.required_experience ?? opportunity.experience_requirements)
  const experience = textOverlap(profile?.experience ?? profile?.experiences, requiredExperience)
  const opportunityLocation = normalize(opportunity.location)
  const studentLocation = normalize(profile?.location)
  const preferenceAvailable = Boolean(studentLocation && opportunityLocation)
  const preferenceValue = !preferenceAvailable ? 0 : /remote|global|worldwide|anywhere/.test(opportunityLocation) || opportunityLocation.includes(studentLocation) || studentLocation.includes(opportunityLocation) ? 100 : 35
  const dimensions = [
    { key: 'skills', label: 'Skills', weight: 30, ...skills },
    { key: 'interests', label: 'Interests', weight: 25, ...interests },
    { key: 'education', label: 'Education', weight: 20, available: grade !== null, value: grade === null ? 0 : grade ? 100 : 0, matched: grade ? [profile?.grade ?? profile?.year] : [], missing: grade === false ? values(opportunity.eligibleGrades ?? opportunity.eligible_grades) : [] },
    { key: 'experience', label: 'Experience', weight: 15, ...experience },
    { key: 'preferences', label: 'Preferences', weight: 10, available: preferenceAvailable, value: preferenceValue, matched: preferenceValue >= 75 ? [profile?.location] : [], missing: preferenceAvailable && preferenceValue < 75 ? [opportunity.location] : [] },
  ]
  const available = dimensions.filter(item => item.available)
  const score = available.length ? Math.round(available.reduce((total, item) => total + item.value * item.weight, 0) / available.reduce((total, item) => total + item.weight, 0)) : 50
  const matchedSkills = skills.matched
  const missingSkills = skills.missing
  const reasons = []
  if (matchedSkills.length) reasons.push(`Your skills match ${matchedSkills.join(', ')}.`)
  const matchedInterests = interests.matched
  if (matchedInterests.length) reasons.push(`This connects with your interests in ${matchedInterests.join(', ')}.`)
  if (grade === true) reasons.push('Your year of study fits the listed education range.')
  if (preferenceValue === 100) reasons.push('The location or remote format fits your preferences.')
  if (!reasons.length) reasons.push(profile ? 'There is limited profile information in common so far; review the breakdown for ways to improve this estimate.' : 'Add a student profile to calculate a personalized compatibility estimate.')
  return { score: Math.max(0, Math.min(100, score)), dimensions, reasons, matchedSkills, missingSkills, profileMissing: !profile }
}

export function evaluateEligibility(opportunity, profile) {
  const checks = []
  const minAge = opportunity.minAge ?? opportunity.min_age
  const maxAge = opportunity.maxAge ?? opportunity.max_age
  if (minAge != null || maxAge != null) {
    const age = Number(profile?.age)
    if (!profile?.age || !Number.isFinite(age)) checks.push({ label: `Age ${minAge ?? '—'}–${maxAge ?? '—'}`, state: 'missing', detail: 'Add your age to check this requirement.' })
    else {
      const passes = (minAge == null || age >= Number(minAge)) && (maxAge == null || age <= Number(maxAge))
      checks.push({ label: `Age ${minAge ?? '—'}–${maxAge ?? '—'}`, state: passes ? 'satisfied' : 'unmet', detail: passes ? 'Your age is within the listed range.' : 'Your age is outside the listed range.' })
    }
  }
  const grades = values(opportunity.eligibleGrades ?? opportunity.eligible_grades)
  if (grades.length) {
    const grade = profile?.grade ?? profile?.year
    const match = gradeMatches(grade, grades)
    checks.push({ label: 'Year / grade', state: match === null ? 'missing' : match ? 'satisfied' : 'unmet', detail: match === null ? 'Add your year or grade to check this requirement.' : match ? `Your year fits: ${grades.join(', ')}.` : `Listed for: ${grades.join(', ')}.` })
  }
  const requiredLocation = values(opportunity.eligibleLocations ?? opportunity.eligible_locations)
  if (requiredLocation.length) {
    const location = normalize(profile?.location)
    const matches = location && requiredLocation.some(item => normalize(item).includes(location) || location.includes(normalize(item)))
    checks.push({ label: 'Location', state: !location ? 'missing' : matches ? 'satisfied' : 'unmet', detail: !location ? 'Add your location to check this requirement.' : matches ? 'Your location matches the listed region.' : `Eligible locations: ${requiredLocation.join(', ')}.` })
  }
  const textRequirements = values(opportunity.eligibility ?? opportunity.eligibilityRequirements ?? opportunity.eligibility_requirements)
  for (const requirement of textRequirements) checks.push({ label: requirement, state: 'unverified', detail: 'This requirement needs manual review.' })
  if (!checks.length) checks.push({ label: 'No structured criteria provided', state: 'unverified', detail: 'Review the official opportunity details before applying.' })
  const status = checks.some(item => item.state === 'unmet') ? 'not-eligible' : checks.some(item => ['missing', 'unverified'].includes(item.state)) ? 'possibly-eligible' : 'eligible'
  return { status, checks, disclaimer: 'Preliminary frontend assessment only. Eligibility does not guarantee selection or an award.' }
}
