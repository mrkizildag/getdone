import type { List } from '@raycast/api'
import type { NotionPropertyValue } from '@/types/notion-property-value'
import type { AccessorySlot } from '@/types/accessory-config'
import type { Project } from '@/types/project'

export interface RendererContext {
  slot: AccessorySlot
  projectsById: Record<string, Project>
}

export interface PropertyRenderer {
  render(
    value: NotionPropertyValue,
    context: RendererContext
  ): List.Item.Accessory[]
  getSearchKeywords(value: NotionPropertyValue): string[]
}
