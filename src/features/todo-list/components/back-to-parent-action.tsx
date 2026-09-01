import { Action, Icon, Keyboard } from '@raycast/api'

/**
 * Vim/yazi-style "climb out" binding. Plain ctrl+h is worse than unusable: macOS
 * binds it to deleteBackward:, so in a focused search field it edits the query
 * instead of navigating.
 */
export const BACK_TO_PARENT_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['cmd', 'shift'],
  key: 'h',
}

interface BackToParentActionProps {
  backTitle: string
  onBack: () => void
}

export function BackToParentAction({
  backTitle,
  onBack,
}: BackToParentActionProps) {
  return (
    <Action
      icon={Icon.ChevronLeft}
      title={`Back to ${backTitle}`}
      shortcut={BACK_TO_PARENT_SHORTCUT}
      onAction={onBack}
    />
  )
}
