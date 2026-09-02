import { Clipboard, getSelectedText, showHUD } from '@raycast/api'
import { loadPreferences } from '@/services/storage'
import { createTodo } from '@/services/notion/operations/create-todo'
import { parseCapture } from '@/services/notion/utils/parse-capture'
import { refreshMenuBar } from '@/features/todo-list/utils/refresh-menu-bar'
import { Todo } from '@/types/todo'

/**
 * Turns whatever is selected into a task without opening a window.
 *
 * Deliberately a `no-view` command: the point is that capture costs nothing.
 * Opening the task list would fetch every task across every level first, which
 * is the reason things get thought of and never written down.
 */
export default async function AddTaskFromSelection() {
  let selection: string

  try {
    selection = await getSelectedText()
  } catch {
    // getSelectedText rejects when the frontmost app exposes no selection.
    await showHUD('No text selected')
    return
  }

  const preferences = await loadPreferences()

  if (!preferences?.databaseId) {
    await showHUD('Open GetDone once to connect a Notion database')
    return
  }

  const captured = parseCapture(selection, {
    hasUrlProperty: !!preferences.properties?.url,
  })

  if (!captured.title) {
    await showHUD('No text selected')
    return
  }

  const todo: Todo = {
    id: 'new',
    title: captured.title,
    url: '',
    shareUrl: '',
    tag: null,
    contentUrl: captured.contentUrl,
    date: captured.date,
    dateValue: captured.dateValue,
  }

  try {
    await createTodo(todo, preferences.databaseId)
    refreshMenuBar()
    await showHUD(`Added: ${captured.title}`)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not create the task'
    await Clipboard.copy(captured.title)
    await showHUD(`${message} — copied to clipboard instead`)
  }
}
