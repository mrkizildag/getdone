import { useDatabases } from '@/services/notion/hooks/use-databases'
import { storePreferences } from '@/services/storage'
import { Database } from '@/types/database'
import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  useNavigation,
} from '@raycast/api'
import { FormValidation, useCachedState, useForm } from '@raycast/utils'
import { useEffect, useState } from 'react'
import { resolveDatabase } from './utils/resolve-database'
import {
  OnboardFormValues,
  normalizeValuesToStore,
} from './utils/normalize-values'

export default function ConfigurationForm({
  revalidate,
  navigation,
}: {
  revalidate?: () => void
  navigation?: boolean
}) {
  const { databases, isLoading } = useDatabases()
  const { pop } = useNavigation()

  const [cachedDatabase, setDatabase] = useCachedState<Database | null>(
    'synced-database',
    null
  )
  const [secondaryDb, setSecondaryDb] = useState<Database | null>(null)

  // Live schema when it has arrived, cached snapshot only as a stand-in.
  const database = resolveDatabase(cachedDatabase, databases)

  // Write the refreshed copy back so the next launch starts from current data
  // rather than replaying the same staleness.
  useEffect(() => {
    if (!cachedDatabase) return

    const live = databases.find((item) => item.id === cachedDatabase.id)
    if (live && JSON.stringify(live) !== JSON.stringify(cachedDatabase)) {
      setDatabase(live)
    }
  }, [databases, cachedDatabase, setDatabase])

  const { handleSubmit, values, setValue } = useForm<OnboardFormValues>({
    async onSubmit(values) {
      const relatedDatabaseTitle = secondaryDb?.columns.title[0]
      const normalizedValues = normalizeValuesToStore(
        values,
        relatedDatabaseTitle
      )

      await storePreferences(normalizedValues)

      if (revalidate) {
        await revalidate()
      }

      showToast({
        style: Toast.Style.Success,
        title: 'Success',
        message: `Reload the extension to see your changes.`,
      })

      if (navigation) {
        pop()
      }
    },
    validation: {
      mainDatabase: FormValidation.Required,
      titleProperty: FormValidation.Required,
      dateProperty: FormValidation.Required,
    },
    initialValues: {
      mainDatabase: '',
      titleProperty: '',
      urlProperty: '',
      dateProperty: '',
      statusProperty: '',
      tagsProperty: '',
      assigneeProperty: '',
      projectProperty: '',
      projectStatusProperty: '',
      subIssuesProperty: '',
    },
  })

  const handleChangeMainDatabase = (value: string) => {
    const valueJson = JSON.parse(value || '{}')
    const database = databases.find((db) => db.id === valueJson.id)

    if (database) {
      // Set database
      setValue('mainDatabase', value)
      setDatabase(database)
      // Set default values
      setValue('titleProperty', database.columns.title[0] || '')
      setValue('dateProperty', database.columns.date[0] || '')
      setValue('statusProperty', database.columns.status[0]?.value || '')
      setValue('tagsProperty', database.columns.tags[0]?.value || '')
      setValue('assigneeProperty', database.columns.assignee[0]?.value || '')
      setValue('urlProperty', database.columns.url[0]?.value || '')
      setValue('subIssuesProperty', database.columns.subIssues[0]?.value || '')
      // Handle project property
      const project = database.columns.project[0]?.value || ''
      setValue('projectProperty', project)
      handleSelectRelatedProperty(project)
    }
  }

  const handleSelectRelatedProperty = (value: string) => {
    const property = JSON.parse(value || '{}')
    const database = databases.find((db) => db.id === property.databaseId)

    if (database) {
      setSecondaryDb(database)
    } else {
      setSecondaryDb(null)
    }

    setValue('projectProperty', value)
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="mainDatabase"
        title="Database"
        value={values.mainDatabase}
        onChange={handleChangeMainDatabase}
        info="Select the database where you will create tasks through GetDone"
        storeValue
      >
        {databases.map((item) => (
          <Form.Dropdown.Item
            key={item.id}
            value={item.value}
            title={item.name}
            icon={{ source: item.image }}
          />
        ))}
      </Form.Dropdown>
      <Form.Description text="Required properties" />
      <Form.Dropdown
        id="titleProperty"
        title="Title"
        value={values.titleProperty}
        onChange={(v) => setValue('titleProperty', v)}
        error={
          !values.titleProperty && !isLoading && !!database
            ? 'Required'
            : undefined
        }
        info="Displayed as task name"
        storeValue
      >
        {database?.columns.title.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item}
            title={item}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="Date"
        id="dateProperty"
        value={values.dateProperty}
        onChange={(v) => setValue('dateProperty', v)}
        error={
          !values.dateProperty && !isLoading && !!database
            ? 'Required'
            : undefined
        }
        info="Displayed as task due date"
        storeValue
      >
        {database?.columns.date.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item}
            title={item}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="Status"
        id="statusProperty"
        value={values.statusProperty}
        onChange={(v) => setValue('statusProperty', v)}
        error={
          !values.statusProperty && !isLoading && !!database
            ? 'Required'
            : undefined
        }
        info="Filter and update tasks based on Status or Checkbox properties"
        storeValue
      >
        {database?.columns.status
          .filter((item) => item.data.name !== 'None')
          .map((item, index) => (
            <Form.Dropdown.Item
              key={`${item.data.name}-${index}`}
              value={item.value}
              title={item.data.name}
            />
          ))}
      </Form.Dropdown>
      <Form.Description text="Optional properties" />
      <Form.Dropdown
        title="Select"
        id="tagsProperty"
        value={values.tagsProperty}
        onChange={(v) => setValue('tagsProperty', v)}
        info="Show additional task labels"
        storeValue
      >
        {database?.columns.tags.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item.value}
            title={item.name}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="Person"
        id="assigneeProperty"
        value={values.assigneeProperty}
        onChange={(v) => setValue('assigneeProperty', v)}
        info="Assign tasks to users"
        storeValue
      >
        {database?.columns.assignee.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item.value}
            title={item.name}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="URL"
        id="urlProperty"
        value={values.urlProperty}
        onChange={(v) => setValue('urlProperty', v)}
        info="Attached url"
        storeValue
      >
        {database?.columns?.url?.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item.value}
            title={item.name}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="Sub-issues"
        id="subIssuesProperty"
        value={values.subIssuesProperty}
        onChange={(v) => setValue('subIssuesProperty', v)}
        info="Choose the property that points at a task's PARENT (in Notion's default sub-item setup that is 'Parent item', not 'Sub-item'). Enables drilling into sub-issues with Tab and back out with Shift+Tab. When set, the main list shows only top-level tasks."
        storeValue
      >
        {database?.columns.subIssues?.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item.data.parentProperty}-${index}`}
            value={item.value}
            title={
              item.data.childProperty
                ? `${item.data.parentProperty} \u2192 ${item.data.childProperty}`
                : item.data.parentProperty
            }
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        title="Relation"
        id="projectProperty"
        value={values.projectProperty}
        onChange={handleSelectRelatedProperty}
        info="Add information from related databases"
        storeValue
      >
        {database?.columns.project.map((item, index) => (
          <Form.Dropdown.Item
            key={`${item}-${index}`}
            value={item.value}
            title={item.data.propertyName}
          />
        ))}
      </Form.Dropdown>
      {secondaryDb ? (
        <>
          <Form.Dropdown
            id="secondary-database"
            title="Related database"
            defaultValue={secondaryDb.name}
            storeValue
          >
            <Form.Dropdown.Item
              key={'secondary-database'}
              value={secondaryDb.name}
              title={secondaryDb.name}
              icon={{ source: secondaryDb.image }}
            />
          </Form.Dropdown>
          <Form.Dropdown
            id="projectStatusProperty"
            title="Exclude"
            value={values.projectStatusProperty}
            onChange={(v) => setValue('projectStatusProperty', v)}
            info="Filter related items based on Status or Checkbox properties"
            storeValue
          >
            {secondaryDb.columns.status.map((item, index) => (
              <Form.Dropdown.Item
                key={`${item.data.name}-${index}`}
                value={item.value}
                title={`${item.data.name}${
                  item.data.doneName ? `: ${item.data.doneName}` : ''
                }`}
              />
            ))}
          </Form.Dropdown>
        </>
      ) : null}
    </Form>
  )
}
