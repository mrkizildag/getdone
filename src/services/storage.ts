import { LocalStorage } from '@raycast/api'
import { SubIssuesConfig } from '@/types/sub-issues'

export type Preferences = {
  databaseUrl: string
  databaseName: string
  databaseId: string
  normalizedUrl: string
  properties: {
    title: string
    date: string
    url?: string
    status: {
      type: 'status' | 'checkbox'
      name: string
      doneName?: string
      completedStatuses?: string[]
      inProgressId?: string
      notStartedId?: string
    }
    tag?: string
    assignee?: string
    project?: string
    subIssues?: SubIssuesConfig
    relatedDatabase?: {
      databaseId?: string
      title?: string
      status?: {
        type?: 'status' | 'checkbox'
        name?: string
        doneName?: string
        completedStatuses?: string[]
      }
    }
  }
}

export const storePreferences = (preferences: Preferences) => {
  return LocalStorage.setItem('PREFERENCES', JSON.stringify(preferences))
}

export const loadPreferences = async (): Promise<Preferences> => {
  const preferences: string | undefined = await LocalStorage.getItem(
    'PREFERENCES'
  )

  return JSON.parse(preferences || '{}')
}
