import { useCallback, useEffect, useState } from 'react'
import { OpportunityContext } from './OpportunityContext'
import { api, normalizeApplication, normalizeOpportunity, normalizeProfile } from '../api/client'
import mockOpportunities from '../data/opportunities.json'

const PROFILE_STORAGE_KEY = 'matchmyopp-student-profile'
const SWIPES_STORAGE_KEY = 'matchmyopp-demo-swipes'
const APPLICATIONS_STORAGE_KEY = 'matchmyopp-demo-applications'

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const isNetworkUnavailable = cause => cause.message.startsWith('Cannot reach the Opportunity Radar API')
const getLocalSwipes = () => readJson(SWIPES_STORAGE_KEY, {})
const getLocalApplications = () => readJson(APPLICATIONS_STORAGE_KEY, [])

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
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const studentId = profile?.student_id

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_STORAGE_KEY)
  }, [profile])

  const loadOpportunities = useCallback(async (showLoading = true) => {
    if (!studentId) return []
    if (showLoading) setLoading(true)
    setError('')
    try {
      const items = await api.getOpportunities(studentId)
      setOpportunities(items)
      setApiStatus('online')
      return items
    } catch (cause) {
      setError(cause.message)
      if (!isNetworkUnavailable(cause)) return []
      setApiStatus('offline')
      const swipes = getLocalSwipes()
      const localItems = mockOpportunities.map(item => normalizeOpportunity(item))
        .filter(item => !swipes[item.id])
      setOpportunities(localItems)
      return localItems
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [studentId])

  const loadSaved = useCallback(async () => {
    if (!studentId) return []
    try {
      const items = await api.getSaved(studentId)
      setSaved(items)
      return items
    } catch (cause) {
      setError(cause.message)
      if (!isNetworkUnavailable(cause)) return []
      setApiStatus('offline')
      const swipes = getLocalSwipes()
      const localItems = mockOpportunities.map(item => normalizeOpportunity(item)).filter(item => swipes[item.id] === 'like')
      setSaved(localItems)
      return localItems
    }
  }, [studentId])

  const loadApplications = useCallback(async () => {
    if (!studentId) return []
    try {
      const items = await api.getApplications(studentId)
      setApplications(items)
      return items
    } catch (cause) {
      setError(cause.message)
      if (!isNetworkUnavailable(cause)) return []
      setApiStatus('offline')
      const items = getLocalApplications().filter(item => item.studentId === studentId)
      setApplications(items)
      return items
    }
  }, [studentId])

  useEffect(() => {
    let active = true
    api.health()
      .then(() => { if (active) setApiStatus('online') })
      .catch(() => {
        if (!active) return
        setApiStatus('offline')
        const swipes = getLocalSwipes()
        setOpportunities(mockOpportunities.map(item => normalizeOpportunity(item)).filter(item => !swipes[item.id]))
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!studentId) return undefined
    let active = true
    api.getProfile(studentId)
      .then(remoteProfile => { if (active && remoteProfile) setProfile(remoteProfile) })
      .catch(cause => { if (active && !isNetworkUnavailable(cause)) setError(cause.message) })
    return () => { active = false }
  }, [studentId])

  useEffect(() => {
    if (!studentId) return undefined
    const refresh = window.setTimeout(() => {
      loadOpportunities(false)
      loadSaved()
      loadApplications()
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
      if (!isNetworkUnavailable(cause)) {
        setError(cause.message)
        throw cause
      }
      setProfile(normalizeProfile(studentProfile))
      setApiStatus('offline')
      setError('API is offline. Your profile is saved on this device for the demo.')
      return normalizeProfile(studentProfile)
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
      if (!isNetworkUnavailable(cause)) {
        setError(cause.message)
        throw cause
      }
      const localProfile = readProfile()
      if (localProfile?.student_id === studentId) {
        setProfile(localProfile)
        setApiStatus('offline')
        setError('API is offline. Loaded your profile saved on this device.')
        return localProfile
      }
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
      if (isNetworkUnavailable(cause)) {
        const swipes = { ...getLocalSwipes(), [opportunityId]: action }
        localStorage.setItem(SWIPES_STORAGE_KEY, JSON.stringify(swipes))
        setApiStatus('offline')
        setOpportunities(items => items.filter(item => item.id !== opportunityId))
        if (action === 'like') setSaved(mockOpportunities.map(item => normalizeOpportunity(item)).filter(item => swipes[item.id] === 'like'))
        setError('API is offline. Your swipe is saved on this device for the demo.')
        return true
      }
      setError(cause.message)
      return false
    }
  }

  const like = opportunityId => swipe(opportunityId, 'like')
  const pass = opportunityId => swipe(opportunityId, 'pass')

  const addApplication = async (opportunityId, notes = '') => {
    try {
      if (!studentId) throw new Error('Create or retrieve your student profile before tracking applications.')
      const application = await api.addApplication(studentId, opportunityId, notes)
      setApplications(items => [application, ...items.filter(item => item.id !== application.id)])
      setApiStatus('online')
      setError('')
      return application
    } catch (cause) {
      if (isNetworkUnavailable(cause)) {
        const opportunity = mockOpportunities.find(item => String(item.id) === String(opportunityId))
        const application = normalizeApplication({
          id: `demo-application-${Date.now()}`, opportunity_id: opportunityId,
          opportunity_title: opportunity?.title, deadline: opportunity?.deadline,
          application_url: opportunity?.application_url, status: 'Interested', notes,
        })
        const items = [application, ...getLocalApplications().filter(item => !(item.studentId === studentId && String(item.opportunityId) === String(opportunityId)))]
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(items.map(item => ({ ...item, studentId }))))
        setApplications(items)
        setApiStatus('offline')
        setError('API is offline. Your application tracker entry is saved on this device for the demo.')
        return application
      }
      setError(cause.message)
      return null
    }
  }

  const updateApplication = async (applicationId, changes) => {
    try {
      const updated = await api.updateApplication(applicationId, changes)
      setApplications(items => items.map(item => item.id === applicationId ? { ...item, ...updated } : item))
      setApiStatus('online')
      setError('')
      return updated
    } catch (cause) {
      if (isNetworkUnavailable(cause)) {
        const items = getLocalApplications().map(item => item.id === applicationId ? { ...item, ...changes } : item)
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(items))
        const updated = items.find(item => item.id === applicationId)
        setApplications(items.filter(item => item.studentId === studentId))
        setApiStatus('offline')
        return updated
      }
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
      if (!isNetworkUnavailable(cause)) throw cause
      setApiStatus('offline')
      const item = mockOpportunities.find(entry => String(entry.id) === String(opportunityId))
      if (!item) throw cause
      return normalizeOpportunity(item)
    }
  }, [])

  const value = {
    profile,
    opportunities,
    saved,
    applications,
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
