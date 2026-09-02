import { Action, Icon, Keyboard } from '@raycast/api'
import { Todo } from '@/types/todo'

/**
 * Tab descends a level. Letter-based bindings were ruled out: macOS claims the
 * plain ctrl+letter range in its standard key bindings (ctrl+l centers the
 * selection, ctrl+h deletes backwards), and a Raycast List keeps the search
 * field focused, so the field swallows them before any action sees them.
 */
export const OPEN_SUB_ISSUES_SHORTCUT: Keyboard.Shortcut = {
  modifiers: [],
  key: 'tab',
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
