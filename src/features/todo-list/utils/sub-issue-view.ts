import { Todo } from '@/types/todo'

export const BREADCRUMB_SEPARATOR = ' › '
export const ROOT_TITLE = 'All Tasks'
export const FLAT_TITLE = 'All Issues'

export interface SubIssueView {
  /** The task whose sub-issues are on screen, or null at the root level. */
  currentParent: Todo | null
  /** Breadcrumb of the current path, empty at the root level. */
  breadcrumb: string
  /** Name of the level that climbing out returns to. */
  backTitle: string
  isNested: boolean
  /** Title for the window header, or undefined for the command default. */
  navigationTitle: string | undefined
  /**
   * Restrict the query to a single level. False only at a flat root, where
   * every task should come back regardless of depth.
   */
  scopeToLevel: boolean
}

/**
 * Everything the tree view needs follows from two pieces of state: the stack of
 * ancestors leading to the level on screen, and whether the root is flattened.
 * Kept pure and separate from the hook so it can be exercised without React.
 */
export function deriveSubIssueView(
  parentStack: Todo[],
  showAllIssues: boolean
): SubIssueView {
  const isNested = parentStack.length > 0
  const currentParent = isNested ? parentStack[parentStack.length - 1] : null
  const parentOfCurrent =
    parentStack.length > 1 ? parentStack[parentStack.length - 2] : null
  const breadcrumb = parentStack
    .map((todo) => todo.title)
    .join(BREADCRUMB_SEPARATOR)

  return {
    currentParent,
    breadcrumb,
    backTitle: parentOfCurrent ? parentOfCurrent.title : ROOT_TITLE,
    isNested,
    navigationTitle: isNested
      ? breadcrumb
      : showAllIssues
      ? FLAT_TITLE
      : undefined,
    scopeToLevel: isNested || !showAllIssues,
  }
}
