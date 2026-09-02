import { Database } from '@/types/database'
import { withKnownColumns } from './known-columns'

/**
 * Decides which copy of the selected database the settings form should render.
 *
 * The cached copy exists so the form has something to show before Notion
 * answers, but it is a snapshot: a property added since it was written — or a
 * whole column list a later build learned to detect — is simply absent from it.
 * Rendering that as though it were current shows an empty dropdown with no hint
 * that anything is missing.
 *
 * So the live schema wins as soon as it arrives, and the cache is only a
 * stand-in until then.
 */
export function resolveDatabase(
  cached: Database | null,
  live: Database[]
): Database | null {
  if (!cached) return null

  const current = live.find((database) => database.id === cached.id)

  return withKnownColumns(current ?? cached)
}
