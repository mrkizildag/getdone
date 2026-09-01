import { describe, expect, test } from 'vitest'
import {
  OnboardFormValues,
  normalizeValuesToStore,
} from '@/features/configuration-form/utils/normalize-values'
import { NONE_VALUE } from '@/services/notion/operations/get-databases'

const STATUS = {
  type: 'status',
  name: 'Status',
  doneName: 'Done',
  completedStatuses: ['Done'],
}

const SUB_ISSUES = { parentProperty: 'Parent item', childProperty: 'Sub-item' }

const values = (overrides: Partial<OnboardFormValues> = {}): OnboardFormValues => ({
  mainDatabase: JSON.stringify({
    id: 'db',
    name: 'Tasks',
    url: 'https://notion.so/db',
  }),
  titleProperty: 'Name',
  dateProperty: 'Due',
  urlProperty: NONE_VALUE,
  tagsProperty: NONE_VALUE,
  assigneeProperty: NONE_VALUE,
  statusProperty: JSON.stringify(STATUS),
  projectProperty: '{}',
  projectStatusProperty: '{}',
  subIssuesProperty: '{}',
  ...overrides,
})

describe('normalizeValuesToStore', () => {
  test('carries the status dropdown value through to preferences', () => {
    const preferences = normalizeValuesToStore(values())

    expect(preferences.properties.status).toMatchObject({
      type: 'status',
      name: 'Status',
      doneName: 'Done',
    })
  })

  test('stores the sub-issue relation when one is chosen', () => {
    const preferences = normalizeValuesToStore(
      values({ subIssuesProperty: JSON.stringify(SUB_ISSUES) })
    )

    expect(preferences.properties.subIssues).toEqual(SUB_ISSUES)
  })

  test('leaves sub-issues unset when None is chosen', () => {
    const preferences = normalizeValuesToStore(values())

    expect(preferences.properties.subIssues).toBeUndefined()
  })

  test('maps the None sentinel to an unset optional property', () => {
    const preferences = normalizeValuesToStore(values())

    expect(preferences.properties.tag).toBeUndefined()
    expect(preferences.properties.assignee).toBeUndefined()
  })

  test('does not throw when a dropdown holds a bare name instead of JSON', () => {
    // The form used to seed statusProperty with the property's name rather than
    // its JSON value. JSON.parse('Status') threw, taking down the whole submit,
    // so nothing was ever saved — including the sub-issue relation.
    const submit = () =>
      normalizeValuesToStore(values({ statusProperty: 'Status' }))

    expect(submit).not.toThrow()
  })

  test('still saves the other settings when one dropdown holds a bad value', () => {
    const preferences = normalizeValuesToStore(
      values({
        statusProperty: 'Status',
        subIssuesProperty: JSON.stringify(SUB_ISSUES),
      })
    )

    expect(preferences.databaseId).toBe('db')
    expect(preferences.properties.title).toBe('Name')
    expect(preferences.properties.subIssues).toEqual(SUB_ISSUES)
  })
})
