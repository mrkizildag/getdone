import type { SupportedPropertyType } from '@/types/accessory-config'
import type { PropertyRenderer } from './property-renderer'
import { selectRenderer } from './renderers/select-renderer'

const NULL_RENDERER: PropertyRenderer = {
  render: () => [],
  getSearchKeywords: () => [],
}

const REGISTRY: Record<SupportedPropertyType, PropertyRenderer> = {
  select: selectRenderer,
  multi_select: NULL_RENDERER,
  status: NULL_RENDERER,
  relation: NULL_RENDERER,
  people: NULL_RENDERER,
  date: NULL_RENDERER,
  formula: NULL_RENDERER,
  url: NULL_RENDERER,
  checkbox: NULL_RENDERER,
  number: NULL_RENDERER,
  rich_text: NULL_RENDERER,
  title: NULL_RENDERER,
}

export function getRenderer(type: SupportedPropertyType): PropertyRenderer {
  return REGISTRY[type] ?? NULL_RENDERER
}
