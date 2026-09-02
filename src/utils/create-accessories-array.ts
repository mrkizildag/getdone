import { Filter } from '@/types/filter'
import { Project } from '@/types/project'
import { Todo } from '@/types/todo'
import { AccessoryConfig } from '@/types/accessory-config'
import { Color, Icon, Image, List } from '@raycast/api'
import { getAvatarIcon } from '@raycast/utils'
import { format } from 'date-fns'
import { getRenderer } from '@/services/accessories/renderer-registry'

type Accessories = List.Item.Accessory[]

const userAccessory = (todo: Partial<Todo>, filter?: Filter): Accessories =>
  todo.user && !filter?.user
    ? [
        {
          icon: {
            source: todo.user.icon
              ? encodeURI(todo.user.icon)
              : getAvatarIcon(todo.user.name),
            mask: Image.Mask.Circle,
          },
          tooltip: todo.user.name,
        },
      ]
    : []

const projectAccessory = (
  todo: Partial<Todo>,
  projectsById: Record<string, Project>,
  filter?: Filter
): Accessories => {
  if (!todo.projectId || filter?.projectId) return []

  const project = projectsById[todo.projectId]
  if (!project) return []

  return [
    {
      text: project.title,
      icon: {
        source: project.icon ? project.icon : getAvatarIcon(project.title),
      },
    },
  ]
}

const statusAccessory = (
  todo: Partial<Todo>,
  showStatus: boolean,
  filter?: Filter
): Accessories =>
  todo.status?.icon && !filter?.status && showStatus
    ? [
        {
          icon: { source: todo.status.icon, tintColor: todo.status.color },
          tooltip: todo.status.name,
        },
      ]
    : []

const configuredAccessories = (
  todo: Partial<Todo>,
  projectsById: Record<string, Project>,
  accessoryConfig?: AccessoryConfig | null
): Accessories =>
  (accessoryConfig?.slots ?? [])
    .filter((slot) => slot.visible)
    .flatMap((slot) => {
      const value = todo.extraProperties?.[slot.propertyName]
      if (!value) return []

      return getRenderer(slot.propertyType).render(value, {
        slot,
        projectsById,
      })
    })

const deadlineAccessory = (todo: Partial<Todo>): Accessories =>
  todo.date
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

const labelAccessory = (todo: Partial<Todo>, filter?: Filter): Accessories =>
  todo.tag && !filter?.tag
    ? [{ tag: { value: todo.tag.name, color: todo.tag.color } }]
    : []

const subIssueAccessory = (todo: Partial<Todo>): Accessories => {
  const count = todo.subIssueIds?.length ?? 0
  if (count === 0) return []

  return [
    {
      icon: Icon.ChevronRight,
      text: `${count}`,
      tooltip: `${count} sub-issue${count === 1 ? '' : 's'}`,
    },
  ]
}

/**
 * Raycast lays accessories out left to right in array order, so this list *is*
 * the visual order: assignee sits closest to the task title, and the row ends
 * with deadline, label, then the sub-issue chevron hard against the right edge.
 * Anything that resolves to nothing simply collapses.
 */
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
}): Accessories {
  return [
    ...userAccessory(todo, filter),
    ...projectAccessory(todo, projectsById, filter),
    ...statusAccessory(todo, showStatus, filter),
    ...configuredAccessories(todo, projectsById, accessoryConfig),
    ...deadlineAccessory(todo),
    ...labelAccessory(todo, filter),
    ...subIssueAccessory(todo),
  ]
}
