import { LaunchProps, showHUD } from '@raycast/api'
import { captureTask } from '@/features/quick-capture/capture-task'

/**
 * Type a task straight into Raycast's root search, or fill `text` from a
 * deeplink so the same command works from a shell, an editor or a hotkey app.
 *
 * `no-view` on purpose: opening the list to write one line would fetch every
 * task at every level first.
 */
export default async function AddTask(
  props: LaunchProps<{ arguments: { text: string } }>
) {
  const result = await captureTask(props.arguments?.text ?? '')

  await showHUD(result.ok ? `Added: ${result.title}` : result.message)
}
