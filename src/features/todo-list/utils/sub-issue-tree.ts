import { Todo } from '@/types/todo'

/**
 * Rewrites each task's children from the fetched set rather than trusting the
 * relation ids Notion returned.
 *
 * Two reasons. Notion only inlines the first 25 entries of a relation, so a
 * wide parent under-reports. And the fetched set excludes completed tasks, so
 * counting the raw relation would promise rows that drilling in never shows.
 * Deriving locally makes the badge equal to what you will actually see.
 */
export function withResolvedChildren(todos: Todo[]): Todo[] {
  const childrenByParent = new Map<string, string[]>()

  for (const todo of todos) {
    if (!todo.parentId) continue

    const siblings = childrenByParent.get(todo.parentId)
    if (siblings) {
      siblings.push(todo.id)
    } else {
      childrenByParent.set(todo.parentId, [todo.id])
    }
  }

  return todos.map((todo) => ({
    ...todo,
    subIssueIds: childrenByParent.get(todo.id) ?? [],
  }))
}

/**
 * Picks the slice of the tree currently on screen. Runs against the already
 * fetched list, so moving between levels costs no network round trip.
 */
export function selectLevel(
  todos: Todo[],
  parentId: string | null,
  showAllIssues: boolean
): Todo[] {
  if (parentId) {
    return todos.filter((todo) => todo.parentId === parentId)
  }

  if (showAllIssues) {
    return todos
  }

  return todos.filter((todo) => !todo.parentId)
}
