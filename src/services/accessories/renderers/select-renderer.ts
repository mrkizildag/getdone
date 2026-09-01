import { notionColorToTintColor } from '@/services/notion/utils/notion-color-to-tint-color'
import type { PropertyRenderer } from '../property-renderer'

export const selectRenderer: PropertyRenderer = {
  render(value, ctx) {
    if (value.type !== 'select' || !value.select) return []

    return [
      {
        tag: {
          value: ctx.slot.label || value.select.name,
          color: notionColorToTintColor(value.select.color),
        },
        tooltip: value.select.name,
      },
    ]
  },
  getSearchKeywords(value) {
    if (value.type !== 'select' || !value.select) return []

    return [value.select.name]
  },
}
