import { describe, expect, test } from 'vitest'
import {
  FLAT_TITLE,
  ROOT_TITLE,
  deriveSubIssueView,
} from '@/features/todo-list/utils/sub-issue-view'
import { Todo } from '@/types/todo'

const todo = (id: string, title: string): Todo => ({
  id,
  title,
  tag: null,
  url: `notion://page/${id}`,
  shareUrl: `https://notion.so/${id}`,
  contentUrl: null,
})

describe('deriveSubIssueView at the root level', () => {
  test('reports no parent and no breadcrumb', () => {
    const view = deriveSubIssueView([], false)

    expect(view.currentParent).toBeNull()
    expect(view.isNested).toBe(false)
    expect(view.breadcrumb).toBe('')
  })

  test('scopes the query to the top level in tree view', () => {
    const view = deriveSubIssueView([], false)

    expect(view.scopeToLevel).toBe(true)
    expect(view.navigationTitle).toBeUndefined()
  })

  test('lifts the level scope in flat view so nested tasks come back', () => {
    const view = deriveSubIssueView([], true)

    expect(view.scopeToLevel).toBe(false)
    expect(view.navigationTitle).toBe(FLAT_TITLE)
  })
})

describe('deriveSubIssueView when nested', () => {
  test('exposes the deepest ancestor as the current parent', () => {
    const view = deriveSubIssueView(
      [todo('a', 'Alpha'), todo('b', 'Beta')],
      false
    )

    expect(view.currentParent?.id).toBe('b')
    expect(view.isNested).toBe(true)
  })

  test('builds a breadcrumb from the whole path', () => {
    const view = deriveSubIssueView(
      [todo('a', 'Alpha'), todo('b', 'Beta'), todo('c', 'Gamma')],
      false
    )

    expect(view.breadcrumb).toBe('Alpha › Beta › Gamma')
    expect(view.navigationTitle).toBe('Alpha › Beta › Gamma')
  })

  test('names the root as the destination one level down', () => {
    const view = deriveSubIssueView([todo('a', 'Alpha')], false)

    expect(view.backTitle).toBe(ROOT_TITLE)
  })

  test('names the grandparent as the destination when deeper', () => {
    const view = deriveSubIssueView(
      [todo('a', 'Alpha'), todo('b', 'Beta')],
      false
    )

    expect(view.backTitle).toBe('Alpha')
  })

  test('keeps the level scope even in flat view', () => {
    // Drilling in is meaningful in both views: a nested level always shows
    // exactly one parent's children.
    const view = deriveSubIssueView([todo('a', 'Alpha')], true)

    expect(view.scopeToLevel).toBe(true)
    expect(view.navigationTitle).toBe('Alpha')
  })
})
