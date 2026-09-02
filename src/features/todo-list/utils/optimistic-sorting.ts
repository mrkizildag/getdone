import { Todo } from '@/types/todo'

const NO_STATUS = 'no-status'

/**
 * Orders tasks by due date, soonest first, with undated tasks last, then groups
 * them by status for the list's sections.
 */
export function optimisticSorting(todos: Todo[]): Record<string, Todo[]> {
  // Copy before sorting: `Array.prototype.sort` works in place, and this is
  // handed data owned by the fetch cache.
  const todosTimeSorted = [...todos].sort((a, b) => {
    if (a.date && b.date) {
      return a.date.getTime() - b.date.getTime()
    } else if (a.date) {
      return -1
    } else if (b.date) {
      return 1
    } else {
      return 0
    }
  })

  return todosTimeSorted.reduce<Record<string, Todo[]>>((grouped, todo) => {
    const key = todo?.status?.id || NO_STATUS
    const bucket = grouped[key]

    if (bucket) {
      bucket.push(todo)
    } else {
      grouped[key] = [todo]
    }

    return grouped
  }, {})
}
