import { NONE_VALUE } from '@/services/notion/operations/get-databases'
import { formatNotionUrl } from '@/services/notion/utils/format-notion-url'
import { Preferences } from '@/services/storage'
import { SubIssuesConfig } from '@/types/sub-issues'

export type OnboardFormValues = {
  mainDatabase: string
  titleProperty: string
  urlProperty: string
  dateProperty: string
  tagsProperty: string
  statusProperty: string
  assigneeProperty: string
  projectProperty: string
  projectStatusProperty: string
  subIssuesProperty: string
}

const handleOptionalField = (value: string): string | undefined => {
  return value === NONE_VALUE ? undefined : value
}

/**
 * Dropdowns that carry structured data hold it as JSON in their value. A value
 * that isn't valid JSON means something wrote the wrong shape into the form, and
 * throwing here would take down the whole submit and lose every other setting
 * with it. Degrade to empty instead so the rest of the form still saves.
 */
const parseValue = (value: string): Record<string, any> => {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}

export const normalizeValuesToStore = (
  values: OnboardFormValues,
  relatedDatabaseTitle?: string
): Preferences => {
  const mainDatabase = parseValue(values.mainDatabase)
  const project = parseValue(values.projectProperty)
  const status = parseValue(values.statusProperty)
  const projectStatus = parseValue(values.projectStatusProperty)
  const subIssues = parseValue(values.subIssuesProperty)

  return {
    databaseId: mainDatabase.id,
    databaseName: mainDatabase.name,
    databaseUrl: mainDatabase.url,
    normalizedUrl: formatNotionUrl(mainDatabase.url),
    properties: {
      title: values.titleProperty,
      date: values.dateProperty,
      url: handleOptionalField(values.urlProperty),
      status: {
        type: status.type,
        name: status.name,
        doneName: status.doneName,
        completedStatuses: status.completedStatuses,
        inProgressId: status.inProgressId,
        notStartedId: status.notStartedId,
      },
      tag: handleOptionalField(values.tagsProperty),
      assignee: handleOptionalField(values.assigneeProperty),
      subIssues: subIssues.parentProperty
        ? ({
            parentProperty: subIssues.parentProperty,
            childProperty: subIssues.childProperty,
          } as SubIssuesConfig)
        : undefined,
      project: project.propertyName,
      relatedDatabase: {
        databaseId: project.databaseId,
        title: relatedDatabaseTitle,
        status: {
          type: projectStatus.type,
          name: projectStatus.name,
          completedStatuses: projectStatus.completedStatuses,
          doneName: projectStatus.doneName,
        },
      },
    },
  }
}
