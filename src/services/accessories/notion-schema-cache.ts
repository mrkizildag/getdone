import { Cache } from '@raycast/api'

export type DbSchema = Record<
  string,
  {
    type: string
    options?: { id: string; name: string; color: string }[]
  }
>

interface CachedEntry {
  data: DbSchema
  fetchedAt: number
}

const TTL_MS = 5 * 60 * 1000

const cache = new Cache({ namespace: 'notion-schema' })

export function getCachedSchema(databaseId: string): DbSchema | null {
  const raw = cache.get(databaseId)
  if (!raw) return null

  const entry = JSON.parse(raw) as CachedEntry

  if (Date.now() - entry.fetchedAt > TTL_MS) {
    return null
  }

  return entry.data
}

export function setCachedSchema(databaseId: string, schema: DbSchema): void {
  const entry: CachedEntry = {
    data: schema,
    fetchedAt: Date.now(),
  }
  cache.set(databaseId, JSON.stringify(entry))
}
