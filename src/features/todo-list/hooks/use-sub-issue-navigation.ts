import { useState } from 'react'
import { Todo } from '@/types/todo'

const BREADCRUMB_SEPARATOR = ' › '
const ROOT_TITLE = 'All Tasks'
const FLAT_TITLE = 'All Issues'

export interface SubIssueNavigation {
  /** Ancestors of the level currently on screen, outermost first. */
  parentStack: Todo[]
  /** The task whose sub-issues are on screen, or null at the root level. */
  currentParent: Todo | null
  /** Breadcrumb of the current path, empty at the root level. */
  breadcrumb: string
  /** Name of the level `goBack` returns to. */
  backTitle: string
  isNested: boolean
  /** At the root level, show every task instead of only parentless ones. */
  showAllIssues: boolean
  /** Title for the window header, or undefined for the command default. */
  navigationTitle: string | undefined
  /**
   * Restrict the query to a single level. False only at a flat root, where
   * every task should come back regardless of depth.
   */
  scopeToLevel: boolean
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

  const currentParent =
    parentStack.length > 0 ? parentStack[parentStack.length - 1] : null

  const parentOfCurrent =
    parentStack.length > 1 ? parentStack[parentStack.length - 2] : null

  const isNested = parentStack.length > 0
  const breadcrumb = parentStack
    .map((todo) => todo.title)
    .join(BREADCRUMB_SEPARATOR)

  return {
    parentStack,
    currentParent,
    breadcrumb,
    backTitle: parentOfCurrent ? parentOfCurrent.title : ROOT_TITLE,
    isNested,
    showAllIssues,
    navigationTitle: isNested
      ? breadcrumb
      : showAllIssues
      ? FLAT_TITLE
      : undefined,
    scopeToLevel: isNested || !showAllIssues,
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
