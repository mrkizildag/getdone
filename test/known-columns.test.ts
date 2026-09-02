import { describe, expect, test } from 'vitest'
import { withKnownColumns } from '@/features/configuration-form/utils/known-columns'
import { Database } from '@/types/database'

const cachedByOlderBuild = {
  id: 'db',
  name: 'Tasks',
  url: 'https://notion.so/db',
  value: '{}',
  image: '',
  columns: {
    title: ['Name'],
    date: ['Due'],
    status: [],
    project: [],
    assignee: [],
    tags: [],
    url: [],
    // subIssues is absent: this build added it after the cache was written.
  },
} as unknown as Database

describe('withKnownColumns', () => {
  test('fills in a column list the cached copy predates', () => {
    const database = withKnownColumns(cachedByOlderBuild)

    expect(database?.columns.subIssues).toEqual([])
  })

  test('leaves the lists the cache does have untouched', () => {
    const database = withKnownColumns(cachedByOlderBuild)

    expect(database?.columns.title).toEqual(['Name'])
    expect(database?.columns.date).toEqual(['Due'])
  })

  test('does not mutate the cached object', () => {
    const cached = { ...cachedByOlderBuild }
    withKnownColumns(cached)

    expect('subIssues' in cached.columns).toBe(false)
  })

  test('passes null through for an unselected database', () => {
    expect(withKnownColumns(null)).toBeNull()
  })
})
