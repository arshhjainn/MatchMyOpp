import { useCallback, useEffect, useRef, useState } from 'react'
import { OpportunityContext } from './OpportunityContext'
import { api, normalizeApplication, normalizeProfile } from '../api/client'
import { normalizeDeadlineGroup } from '../utils/applicationDeadlines'

const PROFILE_STORAGE_KEY = 'matchmyopp-student-profile'
const isConnectionError = cause => cause.message.startsWith('Cannot connect to the backend')

function readProfile() {
  try {
    const profile = normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)))
    return profile?.student_id ? profile : null
  } catch {
    return null
  }
}

export function OpportunityProvider({ children }) {
  const [profile, setProfile] = useState(readProfile)
  const [opportunities, setOpportunities] = useState([])
  const [saved, setSaved] = useState([])
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [deadlineFeed, setDeadlineFeed] = useState(null)
  const [applicationDashboard, setApplicationDashboard] = useState(null)
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const opportunityDetails = useRef(new Map())
  const studentId = profile?.student_id

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_STORAGE_KEY)
  }, [profile])

  const loadOpportunities = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')
    try {
      const items = await api.getOpportunities(studentId)
      setOpportunities(items)
      setApiStatus('online')
      return items
    } catch (cause) {
      setError(cause.message)
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setOpportunities([])
      return []
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [studentId])

  const loadSaved = useCallback(async () => {
    if (!studentId) return []
    try {
      const items = await api.getSaved(studentId)
      setSaved(items)
      setApiStatus('online')
      return items
    } catch (cause) {
      setError(cause.message)
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setSaved([])
      return []
    }
  }, [studentId])

  const loadApplications = useCallback(async () => {
    if (!studentId) {
      setApplications([])
      setDeadlineFeed(null)
      setApplicationDashboard(null)
      setApplicationsLoading(false)
      return []
    }
    setApplicationsLoading(true)
    try {
      const items = await api.getApplications(studentId)
      const [deadlineResult, dashboardResult] = await Promise.allSettled([
        api.getDeadlines(studentId),
        api.getApplicationDashboard(studentId),
      ])
      const deadlines = deadlineResult.status === 'fulfilled' ? deadlineResult.value : null
      const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
      setDeadlineFeed(deadlines)
      setApplicationDashboard(dashboard)
      const deadlineEntries = Object.values(deadlines?.groups ?? {}).flat()
      const deadlineByApplicationId = new Map(deadlineEntries.map(entry => [String(entry.application_id ?? entry.id), entry]))
      const enriched = await Promise.all(items.map(async application => {
        if (application.deadline && application.applicationUrl) return application
        const opportunityId = application.opportunityId
        if (opportunityId == null) return application
        let detail = opportunityDetails.current.get(String(opportunityId))
        if (!detail) {
          try {
            detail = await api.getOpportunity(opportunityId)
            opportunityDetails.current.set(String(opportunityId), detail)
          } catch {
            return application
          }
        }
        return {
          ...application,
          deadline: application.deadline ?? detail.deadline,
          applicationUrl: application.applicationUrl || detail.applicationUrl,
          organization: application.organization || detail.organization,
        }
      }))
      const withDeadlines = enriched.map(application => {
        const entry = deadlineByApplicationId.get(String(application.id))
        return entry ? {
          ...application,
          deadline: application.deadline ?? entry.deadline,
          deadlineGroup: normalizeDeadlineGroup(entry.deadline_group),
          daysRemaining: entry.days_remaining,
          actionable: entry.actionable,
          reminderWindowsDue: entry.reminder_windows_due ?? [],
        } : application
      })
      setApplications(withDeadlines)
      setApiStatus('online')
      setError('')
      return withDeadlines
    } catch (cause) {
      setError(cause.message)
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setApplications([])
      setDeadlineFeed(null)
      setApplicationDashboard(null)
      return []
    }
    finally {
      setApplicationsLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    let active = true
    api.health()
      .then(() => { if (active) setApiStatus('online') })
      .catch(cause => { if (active) { setApiStatus(isConnectionError(cause) ? 'offline' : 'online'); setError(cause.message) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!studentId) return undefined
    let active = true
    api.getProfile(studentId)
      .then(remoteProfile => { if (active && remoteProfile) setProfile(remoteProfile) })
      .catch(cause => {
        if (!active) return
        setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
        setError(cause.message)
        if (cause.status === 404) setProfile(null)
      })
    return () => { active = false }
  }, [studentId])

  useEffect(() => {
    const refresh = window.setTimeout(() => {
      loadOpportunities(false)
      if (studentId) {
        loadSaved()
        loadApplications()
      }
    }, 0)
    return () => window.clearTimeout(refresh)
  }, [profile, studentId, loadOpportunities, loadSaved, loadApplications])

  const saveProfile = async studentProfile => {
    setError('')
    try {
      const savedProfile = await api.saveProfile(studentProfile)
      if (!savedProfile?.student_id) throw new Error('The API saved the profile but did not return a student ID.')
      setProfile(savedProfile)
      setApiStatus('online')
      return savedProfile
    } catch (cause) {
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setError(cause.message)
      throw cause
    }
  }

  const retrieveProfile = async studentId => {
    setError('')
    try {
      const foundProfile = await api.getProfile(studentId)
      if (!foundProfile?.student_id) throw new Error('The API response did not include a student ID.')
      setProfile(foundProfile)
      setApiStatus('online')
      return foundProfile
    } catch (cause) {
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setError(cause.message)
      throw cause
    }
  }

  const swipe = async (opportunityId, action) => {
    if (!studentId) {
      setError('Create or retrieve your student profile before swiping.')
      return false
    }
    try {
      await api.saveSwipe(studentId, opportunityId, action)
      setApiStatus('online')
      setOpportunities(items => items.filter(item => item.id !== opportunityId))
      if (action === 'like') await loadSaved()
      return true
    } catch (cause) {
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setError(cause.message)
      return false
    }
  }

  const like = opportunityId => swipe(opportunityId, 'like')
  const pass = opportunityId => swipe(opportunityId, 'pass')

  const addApplication = async (opportunityId, notes = '') => {
    try {
      if (!studentId) throw new Error('Create or retrieve your student profile before tracking applications.')
      const created = await api.addApplication(studentId, opportunityId, notes)
      const opportunity = [...opportunities, ...saved].find(item => String(item.id) === String(opportunityId))
      const application = normalizeApplication({
        ...created,
        opportunity_id: opportunityId,
        opportunity_title: created.opportunityTitle !== 'Opportunity' ? created.opportunityTitle : opportunity?.title,
        deadline: created.deadline ?? opportunity?.deadline,
        application_url: created.applicationUrl ?? opportunity?.applicationUrl,
      })
      setApplications(items => [application, ...items.filter(item => item.id !== application.id)])
      await loadApplications()
      setApiStatus('online')
      setError('')
      return application
    } catch (cause) {
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setError(cause.message)
      return null
    }
  }

  const updateApplication = async (applicationId, changes) => {
    try {
      const updated = await api.updateApplication(applicationId, changes)
      setApplications(items => items.map(item => item.id === applicationId ? { ...item, ...updated } : item))
      await loadApplications()
      setApiStatus('online')
      setError('')
      return updated
    } catch (cause) {
      setApiStatus(isConnectionError(cause) ? 'offline' : 'online')
      setError(cause.message)
      return null
    }
  }

  const getOpportunity = useCallback(async opportunityId => {
    try {
      const item = await api.getOpportunity(opportunityId)
      setApiStatus('online')
      return item
    } catch (cause) {
      setApiStatus('offline')
      throw cause
    }
  }, [])

  const value = {
    profile,
    opportunities,
    saved,
    applications,
    applicationsLoading,
    deadlineFeed,
    applicationDashboard,
    apiStatus,
    loading,
    error,
    saveProfile,
    retrieveProfile,
    loadOpportunities,
    loadSaved,
    loadApplications,
    getOpportunity,
    like,
    pass,
    addApplication,
    updateApplication,
    clearError: () => setError(''),
  }

  return <OpportunityContext.Provider value={value}>{children}</OpportunityContext.Provider>
}
