import { createContext } from 'react'

export const OpportunityContext = createContext(null)

export const STORAGE_KEY = 'matchmyopp-opportunity-state'

export function readSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { liked: [], passed: [], saved: [] }
  } catch {
    return { liked: [], passed: [], saved: [] }
  }
}
