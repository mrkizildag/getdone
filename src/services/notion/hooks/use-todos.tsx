import { getTodos } from '@/services/notion/operations/get-todos'
import { Filter } from '@/types/filter'
import { AccessoryConfig } from '@/types/accessory-config'
import {
  Alert,
  LaunchType,
  confirmAlert,
  environment,
  useNavigation,
} from '@raycast/api'
import { useCachedPromise } from '@raycast/utils'
import ConfigurationForm from '@/features/configuration-form/configuration-form'

export function useTodos({
  databaseId,
  filter,
  accessoryConfig,
  parentId = null,
  scopeToLevel = false,
}: {
  databaseId: string
  filter: Filter
  accessoryConfig: AccessoryConfig | null
  parentId?: string | null
  scopeToLevel?: boolean
}) {
  const { push } = useNavigation()
  const { data, error, isLoading, mutate, revalidate } = useCachedPromise(
    async (databaseId, filter, accessoryConfig, parentId, scopeToLevel) => {
      const todos = await getTodos({
        databaseId,
        filter,
        accessoryConfig,
        parentId,
        scopeToLevel,
      })
      return todos
    },
    [databaseId, filter, accessoryConfig, parentId, scopeToLevel],
    {
      initialData: [],
      keepPreviousData: true,
      execute: !!databaseId,
      onError: async (error) => {
        if (environment.launchType === LaunchType.Background) {
          // The Alert API cannot be used in background runs, and will throw an exception
          console.log(error)
          return
        }
        const options: Alert.Options = {
          title: 'Failed to fetch tasks',
          message: error.message,
          primaryAction: {
            title: 'Reset Settings',
            onAction: () => {
              push(<ConfigurationForm navigation={true} />)
            },
          },
        }

        await confirmAlert(options)
      },
    }
  )

  return {
    todos: data,
    error,
    isLoading,
    mutate,
    revalidateTodos: revalidate,
  }
}
