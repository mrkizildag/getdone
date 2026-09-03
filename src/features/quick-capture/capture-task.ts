import { Clipboard } from '@raycast/api'
import { createTodo } from '@/services/notion/operations/create-todo'
import { parseCapture } from '@/services/notion/utils/parse-capture'
import { refreshMenuBar } from '@/features/todo-list/utils/refresh-menu-bar'
import { loadPreferences } from '@/services/storage'
import { Todo } from '@/types/todo'

export type CaptureResult =
  | { ok: true; title: string }
  | { ok: false; message: string }

/**
 * Shared by every no-view capture command: they differ only in where the text
 * comes from, so everything after that lives here.
 *
 * On failure the text goes to the clipboard. A capture command exists to stop
 * thoughts being lost, and losing one to a network error would defeat it.
 */
export async function captureTask(text: string): Promise<CaptureResult> {
  const preferences = await loadPreferences()

  if (!preferences?.databaseId) {
    return { ok: false, message: 'Open GetDone once to connect a database' }
  }

  const captured = parseCapture(text, {
    hasUrlProperty: !!preferences.properties?.url,
  })

  if (!captured.title) {
    return { ok: false, message: 'Nothing to add' }
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
    return { ok: true, title: captured.title }
  } catch (error: unknown) {
    await Clipboard.copy(captured.title)
    const reason =
      error instanceof Error ? error.message : 'Could not reach Notion'
    return { ok: false, message: `${reason} — copied to clipboard` }
  }
}
