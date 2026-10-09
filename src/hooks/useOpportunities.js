import { useContext } from 'react'
import { OpportunityContext } from '../context/OpportunityContext'

export function useOpportunities() {
  const context = useContext(OpportunityContext)
  if (!context) throw new Error('useOpportunities must be used within OpportunityProvider')
  return context
}
