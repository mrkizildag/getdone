import { Preferences } from '@/services/storage'
import { Todo } from '@/types/todo'
import { User } from '@/types/user'
import { AccessoryConfig } from '@/types/accessory-config'
import { NotionPropertyValue } from '@/types/notion-property-value'
import { formatNotionUrl } from './format-notion-url'
import { getContentUrl } from './get-content-url'
import { normalizeTag } from './normalize-tag'
import { normalizeUser } from './normalize-user'

export const normalizeTodo = ({
  page,
  preferences,
  accessoryConfig,
}: {
  page: any
  preferences: Preferences['properties']
  accessoryConfig: AccessoryConfig | null
}): Todo => {
  const dateValue = page.properties[preferences.date]?.date?.start || null

  const urlProperty = preferences?.url
    ? page.properties[preferences.url]?.url
    : null

  const contentUrl = getContentUrl(
    page.properties[preferences.title]?.title[0]?.text?.content,
    urlProperty
  )

  const title =
    page.properties[preferences.title]?.title[0]?.text?.content || 'Untitled'

  const titleWithGlyph = contentUrl ? `${title} ↗` : title

  const extraProperties = accessoryConfig
    ? extractExtraProperties(page, accessoryConfig)
    : {}

  const subIssues = preferences.subIssues

  return {
    id: page.id,
    title: titleWithGlyph,
    tag: preferences.tag
      ? page.properties[preferences.tag].select
        ? normalizeTag(page.properties[preferences.tag].select)
        : null
      : null,
    url: formatNotionUrl(page.url),
    shareUrl: page.url,
    contentUrl,
    status: {
      ...page.properties[preferences.status.name]?.status,
    },
    projectId: preferences.project
      ? page.properties[preferences.project]?.relation[0]?.id
      : null,
    user: preferences.assignee
      ? normalizeUserOrPeople(page.properties[preferences.assignee])
      : null,
    dateValue: dateValue,
    date: dateValue ? new Date(dateValue) : null,
    extraProperties,
    parentId: subIssues
      ? page.properties[subIssues.parentProperty]?.relation?.[0]?.id ?? null
      : null,
    subIssueIds:
      subIssues?.childProperty && page.properties[subIssues.childProperty]
        ? (page.properties[subIssues.childProperty].relation ?? []).map(
            (relation: { id: string }) => relation.id
          )
        : [],
  }
}

const extractExtraProperties = (
  page: any,
  accessoryConfig: AccessoryConfig
): Record<string, NotionPropertyValue> => {
  return accessoryConfig.slots.reduce<Record<string, NotionPropertyValue>>(
    (acc, slot) => {
      const raw = page.properties[slot.propertyName]
      if (!raw || raw.type !== slot.propertyType) return acc

      return { ...acc, [slot.propertyName]: raw as NotionPropertyValue }
    },
    {}
  )
}

const normalizeUserOrPeople = (item: any): User | null => {
  if (item.type === 'person') {
    return normalizeUser(item)
  }

  if (item.type === 'people') {
    const person = item.people[0]

    if (!person) return null

    return normalizeUser(person)
  }

  return null
}
