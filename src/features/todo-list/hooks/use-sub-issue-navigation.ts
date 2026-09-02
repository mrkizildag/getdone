import { useState } from 'react'
import { useCachedState } from '@raycast/utils'
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

/** Cache key for the view mode. Namespaced so it reads unambiguously. */
const SHOW_ALL_ISSUES_KEY = 'sub-issues-show-all'

/**
 * Yazi-style drill-down state for the task tree: `drillInto` descends into a
 * task's sub-issues, `goBack` climbs one level towards the root.
 */
export function useSubIssueNavigation(): SubIssueNavigation {
  // The ancestor stack stays ephemeral on purpose. It describes where you were
  // in a browsing session; restoring it would drop you three levels into the
  // tree on launch with no memory of how you got there.
  const [parentStack, setParentStack] = useState<Todo[]>([])

  // The view mode is a preference rather than a position, so it survives.
  const [showAllIssues, setShowAllIssues] = useCachedState(
    SHOW_ALL_ISSUES_KEY,
    false
  )

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
