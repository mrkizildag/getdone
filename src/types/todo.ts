import { Status } from './status'
import { Tag } from './tag'
import { User } from './user'
import { NotionPropertyValue } from './notion-property-value'

export interface Todo {
  id: string
  title: string
  previewTitle?: string
  tag: Tag | null
  url: string
  shareUrl: string
  contentUrl: string | null
  inProgress?: string
  projectId?: string | null
  user?: User | null
  date?: Date | null
  dateValue?: string | null
  status?: Status | Partial<Status> | null
  extraProperties?: Record<string, NotionPropertyValue>
  /** Id of this task's parent task, when sub-issues are configured. */
  parentId?: string | null
  /** Ids of this task's children. Empty when Notion exposes no child side. */
  subIssueIds?: string[]
}
