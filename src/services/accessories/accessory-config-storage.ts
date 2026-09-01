import { LocalStorage } from '@raycast/api'
import { AccessoryConfig } from '@/types/accessory-config'

const buildKey = (databaseId: string) => `ACCESSORY_CONFIG_${databaseId}`

export const loadAccessoryConfig = async (
  databaseId: string
): Promise<AccessoryConfig | null> => {
  const raw: string | undefined = await LocalStorage.getItem(
    buildKey(databaseId)
  )

  if (!raw) return null

  return JSON.parse(raw) as AccessoryConfig
}

export const storeAccessoryConfig = (
  config: AccessoryConfig
): Promise<void> => {
  return LocalStorage.setItem(
    buildKey(config.databaseId),
    JSON.stringify(config)
  )
}
