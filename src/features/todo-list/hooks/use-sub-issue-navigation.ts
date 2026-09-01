import { useState } from 'react'
import { Todo } from '@/types/todo'

const BREADCRUMB_SEPARATOR = ' › '
const ROOT_TITLE = 'All Tasks'

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
  drillInto: (todo: Todo) => void
  goBack: () => void
  goToRoot: () => void
}

/**
 * Yazi-style drill-down state for the task tree: `drillInto` descends into a
 * task's sub-issues, `goBack` climbs one level towards the root.
 */
export function useSubIssueNavigation(): SubIssueNavigation {
  const [parentStack, setParentStack] = useState<Todo[]>([])

  const currentParent =
    parentStack.length > 0 ? parentStack[parentStack.length - 1] : null

  const parentOfCurrent =
    parentStack.length > 1 ? parentStack[parentStack.length - 2] : null

  return {
    parentStack,
    currentParent,
    breadcrumb: parentStack
      .map((todo) => todo.title)
      .join(BREADCRUMB_SEPARATOR),
    backTitle: parentOfCurrent ? parentOfCurrent.title : ROOT_TITLE,
    isNested: parentStack.length > 0,
    drillInto: (todo: Todo) => setParentStack((stack) => [...stack, todo]),
    goBack: () => setParentStack((stack) => stack.slice(0, -1)),
    goToRoot: () => setParentStack([]),
  }
}
