import { Action, Icon, Keyboard } from '@raycast/api'

/** Shift+Tab climbs a level, mirroring Tab. */
export const BACK_TO_PARENT_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['shift'],
  key: 'tab',
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
