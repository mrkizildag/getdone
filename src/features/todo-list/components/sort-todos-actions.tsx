import { Action, ActionPanel, Color, Icon, Keyboard } from '@raycast/api'
import { SORT_MODES, SortMode } from '@/features/todo-list/utils/sort-todos'

/**
 * `cmd+d` already sets a due date, so sorting by deadline takes the shifted
 * variant. Plain `ctrl` combinations are unusable here: macOS claims most of
 * that range and the always-focused search field swallows the keypress.
 */
export const SORT_BY_DEADLINE_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['cmd', 'shift'],
  key: 'd',
}

interface SortModeProps {
  sortMode: SortMode
  onSetSortMode: (mode: SortMode) => void
}

/**
 * Every mode in one submenu, so the feature costs a single slot in the panel
 * instead of a shortcut per mode.
 *
 * Both of these belong below `SetStatusAction`: Raycast binds `cmd+enter` to
 * whichever action comes second, and status selection owns it.
 */
export function SortModeSubmenu({ sortMode, onSetSortMode }: SortModeProps) {
  return (
    <ActionPanel.Submenu
      title="Sort Tasks"
      icon={{ source: Icon.ArrowDown, tintColor: Color.PrimaryText }}
    >
      {SORT_MODES.map((option) => (
        <Action
          key={option.id}
          autoFocus={option.id === sortMode}
          icon={option.id === sortMode ? Icon.CheckCircle : Icon.Circle}
          title={option.title}
          onAction={() => onSetSortMode(option.id)}
        />
      ))}
    </ActionPanel.Submenu>
  )
}

/** The one mode worth a direct shortcut: what is due next. */
export function SortByDeadlineAction({
  sortMode,
  onSetSortMode,
}: SortModeProps) {
  const isSortedByDeadline = sortMode === 'deadline'

  return (
    <Action
      icon={isSortedByDeadline ? Icon.BulletPoints : Icon.Calendar}
      title={isSortedByDeadline ? 'Group by Status' : 'Sort by Deadline'}
      shortcut={SORT_BY_DEADLINE_SHORTCUT}
      // A single key that only ever sorts would leave no way back to the
      // grouped list without opening the submenu, so it toggles.
      onAction={() => onSetSortMode(isSortedByDeadline ? 'status' : 'deadline')}
    />
  )
}
