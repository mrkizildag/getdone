import { Todo } from '@/types/todo'

export type SortMode = 'status' | 'deadline' | 'title'

export interface SortModeOption {
  id: SortMode
  /** Entry in the sort submenu. */
  title: string
  /**
   * Header of the single section this mode renders, or null for a mode that
   * groups instead and titles its sections after the group.
   */
  sectionTitle: string | null
}

/**
 * Notion exposes no creation timestamp on a task once it is normalized, so
 * "sort by created" is deliberately absent rather than faked from another
 * property.
 */
export const SORT_MODES: readonly SortModeOption[] = [
  { id: 'status', title: 'Group by Status', sectionTitle: null },
  { id: 'deadline', title: 'Sort by Deadline', sectionTitle: 'By Deadline' },
  { id: 'title', title: 'Sort by Title', sectionTitle: 'By Title' },
]

export const DEFAULT_SORT_MODE: SortMode = 'status'

const SORT_MODE_IDS: readonly string[] = SORT_MODES.map((option) => option.id)

/**
 * A cached mode outlives the release that wrote it, so it is untrusted input
 * on the way back in.
 */
export function isSortMode(value: unknown): value is SortMode {
  return typeof value === 'string' && SORT_MODE_IDS.includes(value)
}

export function sortModeOption(mode: SortMode): SortModeOption {
  return SORT_MODES.find((option) => option.id === mode) ?? SORT_MODES[0]
}

/** True for modes that keep the status sections rather than flattening them. */
export function isGroupedSortMode(mode: SortMode): boolean {
  return sortModeOption(mode).sectionTitle === null
}

/** Soonest due date first, undated tasks last. */
export function compareByDueDate(a: Todo, b: Todo): number {
  if (a.date && b.date) {
    return a.date.getTime() - b.date.getTime()
  } else if (a.date) {
    return -1
  } else if (b.date) {
    return 1
  } else {
    return 0
  }
}

const compareByTitle = (a: Todo, b: Todo): number =>
  a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })

const COMPARATORS: Record<SortMode, (a: Todo, b: Todo) => number> = {
  // Status grouping orders by due date inside each group, so it shares the
  // deadline comparator.
  status: compareByDueDate,
  deadline: compareByDueDate,
  title: compareByTitle,
}

/**
 * Orders a level of the task list. The sort is stable, so tasks the mode
 * cannot separate keep the order they arrived in.
 */
export function sortTodos(todos: Todo[], mode: SortMode): Todo[] {
  // Copy before sorting: `Array.prototype.sort` works in place, and this is
  // handed data owned by the fetch cache.
  return [...todos].sort(COMPARATORS[mode])
}
