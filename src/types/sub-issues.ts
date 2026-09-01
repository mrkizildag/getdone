/**
 * Notion models sub-items as a pair of self-referencing relation properties on
 * the same database: one pointing at a page's parent, one listing its children.
 *
 * Only `parentProperty` is required — every query can be derived from it. The
 * child side is an optimisation: when the relation is a dual property, Notion
 * returns the children inline on the page, so sub-issue counts cost no extra
 * API call. Single-property relations have no child side.
 */
export interface SubIssuesConfig {
  /** Relation property on a task that points at its parent task. */
  parentProperty: string
  /** Relation property listing a task's children, when Notion exposes one. */
  childProperty?: string
}
