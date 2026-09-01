import { Database } from '@/types/database'
import { SubIssuesConfig } from '@/types/sub-issues'
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { notion } from '../client'

export const NONE_VALUE = 'NONE_PROPERTY_SELECTED_123456'

export async function getDatabases(): Promise<Database[]> {
  const notionClient = await notion()

  const databases = await notionClient.search({
    filter: { property: 'object', value: 'database' },
  })

  const normalizedDatabases = databases.results.map((database) => {
    const d = database as DatabaseObjectResponse

    return {
      id: d.id,
      name: d.title[0]?.plain_text || 'Untitled',
      url: d.url,
      value: JSON.stringify({
        id: d.id,
        name: d.title[0]?.plain_text || 'Untitled',
        url: d.url,
      }),
      image: normalizeImage(d.icon),
      columns: normalizeColumns(d.properties, d.id),
    }
  })

  return normalizedDatabases
}

const normalizeImage = (icon: DatabaseObjectResponse['icon']): string => {
  if (icon?.type === 'emoji') {
    return icon.emoji
  }

  if (icon?.type === 'external') {
    return icon.external?.url
  }

  return ''
}

const NONE_SUB_ISSUES = {
  data: { parentProperty: 'None' },
  value: '{}',
}

/**
 * Ranks candidate sub-issue relations so the one that actually points at the
 * parent is preselected. Notion's native sub-items default to "Parent item" /
 * "Sub-item", but both sides are self-referencing and indistinguishable by
 * shape alone, so fall back to naming and let the user override in settings.
 */
const parentLikelihood = ({ data }: { data: SubIssuesConfig }): number => {
  if (/parent/i.test(data.parentProperty)) return 2
  if (/sub-?item|sub-?issue|sub-?task|child/i.test(data.parentProperty))
    return 0
  return 1
}

const normalizeColumns = (
  properties: DatabaseObjectResponse['properties'],
  databaseId: string
): Database['columns'] => {
  const propertiesValues = Object.values(properties)
  const columns: Database['columns'] = {
    title: [],
    date: [],
    status: [],
    project: [{ data: { databaseId: '', propertyName: 'None' }, value: '{}' }],
    subIssues: [],
    assignee: [{ name: 'None', value: NONE_VALUE }],
    tags: [{ name: 'None', value: NONE_VALUE }],
    url: [{ name: 'None', value: NONE_VALUE }],
  }

  propertiesValues.forEach((item) => {
    if (item.type === 'title') {
      columns.title.push(item.name)
    }

    if (item.type === 'date') {
      columns.date.push(item.name)
    }

    if (item.type === 'status') {
      const completeGroup = item.status.groups[2]

      const completedOptions = item.status?.options
        .filter((option) => completeGroup?.option_ids.includes(option.id))
        .map((option) => option.name)

      const data = {
        type: item.type,
        name: item.name,
        doneName: item.status?.options[item.status.options.length - 1]?.name,
        completedStatuses: completedOptions,
        inProgressId:
          item.status.groups[1].option_ids[
            item.status.groups[1].option_ids.length - 1
          ],
        notStartedId:
          item.status.groups[0].option_ids[
            item.status.groups[0].option_ids.length - 1
          ],
      }

      columns.status.unshift({ data, value: JSON.stringify(data) })
    }

    if (item.type === 'checkbox') {
      const data = {
        type: item.type,
        name: item.name,
      }

      columns.status.unshift({
        data,
        value: JSON.stringify(data),
      })
    }

    if (item.type === 'relation') {
      const data = {
        databaseId: item.relation.database_id,
        propertyName: item.name,
      }

      columns.project.unshift({ data, value: JSON.stringify(data) })

      // A relation pointing back at its own database is how Notion models
      // sub-items, so it is also a sub-issue candidate.
      if (item.relation.database_id === databaseId) {
        const subIssues: SubIssuesConfig = {
          parentProperty: item.name,
          childProperty:
            item.relation.type === 'dual_property'
              ? item.relation.dual_property.synced_property_name
              : undefined,
        }

        columns.subIssues.push({
          data: subIssues,
          value: JSON.stringify(subIssues),
        })
      }
    }

    if (item.type === 'people') {
      columns.assignee.unshift({ name: item.name, value: item.name })
    }

    if (item.type === 'select') {
      columns.tags.unshift({ name: item.name, value: item.name })
    }

    if (item.type === 'url') {
      columns.url.unshift({ name: item.name, value: item.name })
    }
  })

  return {
    ...columns,
    // None leads so that defaulting to the first option leaves sub-issues off:
    // enabling them changes which tasks the main list shows, which should be a
    // deliberate choice rather than something an upgrade does silently. The
    // most parent-looking relation sorts directly beneath it.
    subIssues: [
      NONE_SUB_ISSUES,
      ...[...columns.subIssues].sort(
        (a, b) => parentLikelihood(b) - parentLikelihood(a)
      ),
    ],
  }
}
