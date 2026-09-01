import { useState } from 'react'
import { Todo } from '@/types/todo'
import {
  SubIssueView,
  deriveSubIssueView,
} from '@/features/todo-list/utils/sub-issue-view'

export interface SubIssueNavigation extends SubIssueView {
  /** Ancestors of the level currently on screen, outermost first. */
  parentStack: Todo[]
  /** At the root level, show every task instead of only parentless ones. */
  showAllIssues: boolean
  drillInto: (todo: Todo) => void
  goBack: () => void
  goToRoot: () => void
  toggleShowAllIssues: () => void
}

/**
 * Yazi-style drill-down state for the task tree: `drillInto` descends into a
 * task's sub-issues, `goBack` climbs one level towards the root.
 */
export function useSubIssueNavigation(): SubIssueNavigation {
  const [parentStack, setParentStack] = useState<Todo[]>([])
  const [showAllIssues, setShowAllIssues] = useState(false)

  return {
    ...deriveSubIssueView(parentStack, showAllIssues),
    parentStack,
    showAllIssues,
    drillInto: (todo: Todo) => setParentStack((stack) => [...stack, todo]),
    goBack: () => setParentStack((stack) => stack.slice(0, -1)),
    goToRoot: () => setParentStack([]),
    // Switching view mode returns to the top: the ancestor stack describes a
    // path through the tree, which has no meaning in the flat view.
    toggleShowAllIssues: () => {
      setShowAllIssues((current) => !current)
      setParentStack([])
    },
  }
}
