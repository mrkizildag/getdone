import { useCachedState } from '@raycast/utils'
import {
  DEFAULT_SORT_MODE,
  SortMode,
  isSortMode,
} from '@/features/todo-list/utils/sort-todos'

/** Cache key for the sort mode. Namespaced so it reads unambiguously. */
const SORT_MODE_KEY = 'todo-list-sort-mode'

export interface SortModeState {
  sortMode: SortMode
  setSortMode: (mode: SortMode) => void
}

/**
 * How the list is ordered is a preference rather than a position, so it
 * survives across launches the way the sub-issue view mode does.
 */
export function useSortMode(): SortModeState {
  const [storedMode, setStoredMode] = useCachedState<SortMode>(
    SORT_MODE_KEY,
    DEFAULT_SORT_MODE
  )

  return {
    // A mode cached by an older release may no longer exist; falling back beats
    // rendering a list with no sections at all.
    sortMode: isSortMode(storedMode) ? storedMode : DEFAULT_SORT_MODE,
    setSortMode: setStoredMode,
  }
}
