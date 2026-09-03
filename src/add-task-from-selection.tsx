import { getSelectedText, showHUD } from '@raycast/api'
import { captureTask } from '@/features/quick-capture/capture-task'

/**
 * Turns whatever is selected into a task without opening a window.
 *
 * Note this reads the frontmost app's accessibility selection, so it sees a
 * browser or a native text field but not a visual-mode selection inside a
 * terminal. Use `add-task` with a `text` argument from there.
 */
export default async function AddTaskFromSelection() {
  let selection: string

  try {
    selection = await getSelectedText()
  } catch {
    // Rejects when the frontmost app exposes no selection at all.
    await showHUD('No text selected')
    return
  }

  const result = await captureTask(selection)

  await showHUD(result.ok ? `Added: ${result.title}` : result.message)
}
