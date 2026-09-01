import { Filter } from '@/types/filter'
import { Project } from '@/types/project'
import { Todo } from '@/types/todo'
import { AccessoryConfig } from '@/types/accessory-config'
import { Color, Image, List } from '@raycast/api'
import { getAvatarIcon } from '@raycast/utils'
import { format } from 'date-fns'
import { getRenderer } from '@/services/accessories/renderer-registry'

export function createAccessoriesArray({
  todo,
  projectsById,
  filter,
  showStatus = true,
  accessoryConfig,
}: {
  todo: Partial<Todo>
  projectsById: Record<string, Project>
  filter?: Filter
  showStatus?: boolean
  accessoryConfig?: AccessoryConfig | null
}): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = []

  if (todo.projectId && !filter?.projectId) {
    const project = projectsById[todo.projectId]
    if (project) {
      accessories.push({
        text: project.title,
        icon: {
          source: project.icon ? project.icon : getAvatarIcon(project.title),
        },
      })
    }
  }

  if (todo.tag && !filter?.tag) {
    accessories.push({
      tag: { value: todo.tag?.name, color: todo.tag.color },
    })
  }

  if (todo.status && todo.status.icon && !filter?.status && showStatus) {
    accessories.push({
      icon: {
        source: todo.status.icon,
        tintColor: todo.status.color,
      },
      tooltip: todo.status.name,
    })
  }

  if (todo.user && !filter?.user) {
    accessories.push({
      icon: {
        source: todo.user.icon
          ? encodeURI(todo.user.icon)
          : getAvatarIcon(todo.user.name),
        mask: Image.Mask.Circle,
      },
      tooltip: todo.user.name,
    })
  }

  const configuredAccessories = (accessoryConfig?.slots ?? [])
    .filter((slot) => slot.visible)
    .flatMap((slot) => {
      const value = todo.extraProperties?.[slot.propertyName]
      if (!value) return []

      return getRenderer(slot.propertyType).render(value, {
        slot,
        projectsById,
      })
    })

  const dateAccessory: List.Item.Accessory[] = todo.date
    ? [
        {
          ...(todo.date < new Date()
            ? { icon: { source: 'calendar-cross.svg', tintColor: Color.Red } }
            : {}),
          date: todo.date,
          tooltip: format(todo.date, "EEEE d MMMM yyyy 'at' HH:mm"),
        },
      ]
    : []

  return [...accessories, ...configuredAccessories, ...dateAccessory]
}
