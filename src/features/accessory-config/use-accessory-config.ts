import { useCachedPromise } from '@raycast/utils'
import { loadAccessoryConfig } from '@/services/accessories/accessory-config-storage'

export function useAccessoryConfig(databaseId: string | undefined) {
  const { data, error, isLoading, mutate, revalidate } = useCachedPromise(
    async (id: string) => loadAccessoryConfig(id),
    [databaseId ?? ''],
    {
      keepPreviousData: true,
      execute: !!databaseId,
    }
  )

  return {
    accessoryConfig: data ?? null,
    error,
    isLoading,
    mutate,
    revalidateAccessoryConfig: revalidate,
  }
}
