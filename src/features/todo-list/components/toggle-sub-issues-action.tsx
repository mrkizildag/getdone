import { Action, Icon, Keyboard } from '@raycast/api'

/**
 * `cmd+o` is already bound to "Open in Notion", so the view toggle takes the
 * shifted variant.
 */
export const TOGGLE_SUB_ISSUES_SHORTCUT: Keyboard.Shortcut = {
  modifiers: ['cmd', 'shift'],
  key: 'o',
}

interface ToggleSubIssuesActionProps {
  showAllIssues: boolean
  onToggle: () => void
}

export function ToggleSubIssuesAction({
  showAllIssues,
  onToggle,
}: ToggleSubIssuesActionProps) {
  return (
    <Action
      icon={showAllIssues ? Icon.Tree : Icon.BulletPoints}
      title={showAllIssues ? 'Show Top-Level Only' : 'Show All Issues'}
      shortcut={TOGGLE_SUB_ISSUES_SHORTCUT}
      onAction={onToggle}
    />
  )
}
