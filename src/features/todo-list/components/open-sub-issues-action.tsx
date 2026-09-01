import { Action, Icon, Keyboard } from '@raycast/api'
import { Todo } from '@/types/todo'

/**
 * Vim/yazi-style "descend into" binding. Keeps the `l` of hjkl, but plain ctrl+l
 * is unusable here: macOS binds it to centerSelectionInVisibleArea: in its
 * standard key bindings, and a Raycast List keeps the search field focused, so
 * the field swallows the keypress before any action ever sees it.
 */
export const OPEN_SUB_ISSUES_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['cmd', 'shift'],
  key: 'l',
}

interface OpenSubIssuesActionProps {
  todo: Todo
  onOpen: (todo: Todo) => void
}

export function OpenSubIssuesAction({
  todo,
  onOpen,
}: OpenSubIssuesActionProps) {
  const count = todo.subIssueIds?.length ?? 0

  return (
    <Action
      icon={Icon.ChevronRight}
      title={
        count > 0
          ? `Open ${count} Sub-issue${count === 1 ? '' : 's'}`
          : 'Open Sub-issues'
      }
      shortcut={OPEN_SUB_ISSUES_SHORTCUT}
      onAction={() => onOpen(todo)}
    />
  )
}
