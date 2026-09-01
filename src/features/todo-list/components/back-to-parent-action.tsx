import { Action, Icon, Keyboard } from '@raycast/api'

/** Vim/yazi-style "climb out" binding. */
export const BACK_TO_PARENT_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['ctrl'],
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
