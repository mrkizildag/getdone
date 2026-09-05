import { Status } from '@/types/status'
import { Todo } from '@/types/todo'
import { optimisticSorting } from './optimistic-sorting'
import { SortMode, sortModeOption, sortTodos } from './sort-todos'

export interface TodoSection {
  key: string
  title: string
  subtitle: string
  /** Status every row in the section shares, or null when the list is flat. */
  status: Status | null
  todos: Todo[]
}

const issueCount = (amount: number): string =>
  amount === 1 ? '1 issue' : `${amount} issues`

/**
 * Turns a level of the task list into the sections the list renders.
 *
 * Status is the only mode that groups. Ordering the whole level by anything
 * else — a deadline, a title — fights the status sections, which would cut the
 * order back up into per-status runs, so those modes collapse to one section.
 */
export function buildTodoSections({
  todos,
  statuses,
  sortMode,
}: {
  todos: Todo[]
  statuses: Status[]
  sortMode: SortMode
}): TodoSection[] {
  const { sectionTitle } = sortModeOption(sortMode)

  if (sectionTitle) {
    const sorted = sortTodos(todos, sortMode)

    return [
      {
        key: `sort-${sortMode}`,
        title: sectionTitle,
        subtitle: issueCount(sorted.length),
        status: null,
        todos: sorted,
      },
    ]
  }

  const grouped = optimisticSorting(todos)

  // Driven by the status list rather than by the groups, so the sections keep
  // the order the database defines and empty statuses stay in place.
  return statuses.map((status) => {
    const todosInStatus = grouped[status.id] ?? []

    return {
      key: status.id,
      title: status.name,
      subtitle: issueCount(todosInStatus.length),
      status,
      todos: todosInStatus,
    }
  })
}
