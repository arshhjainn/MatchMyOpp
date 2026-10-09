export const PDF_DRAFTS_KEY = 'matchmyopp-local-pdf-drafts'

export async function processPdfDemo(file, onProgress = () => {}) {
  if (!file || file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF file to continue.')
  for (const progress of [18, 42, 68, 91, 100]) {
    await new Promise(resolve => window.setTimeout(resolve, 220))
    onProgress(progress)
  }
  return {
    title: 'Student Innovation Opportunity (sample)',
    organizer: 'Example Student Foundation',
    category: 'Scholarship',
    description: 'Sample opportunity description shown in demo mode. The selected PDF has not been read.',
    eligibility: '',
    requiredSkills: '',
    deadline: '',
    reward: '',
    location: '',
    applicationUrl: '',
  }
}
