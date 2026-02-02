/**
 * Universal filter system types
 * Used across all dashboards for consistent filtering
 */

export type FilterOperator =
  | 'eq'           // equals
  | 'ne'           // not equals
  | 'contains'     // contains text
  | 'notContains'  // doesn't contain
  | 'startsWith'   // starts with
  | 'endsWith'     // ends with
  | 'gt'           // greater than
  | 'gte'          // greater than or equal
  | 'lt'           // less than
  | 'lte'          // less than or equal
  | 'in'           // in array
  | 'notIn'        // not in array
  | 'isEmpty'      // is null/undefined/empty
  | 'isNotEmpty'   // is not null/undefined/empty

export type FilterCombinator = 'AND' | 'OR'

export interface FilterRule {
  id: string
  field: string
  operator: FilterOperator
  value: string | number | boolean | string[] | null
}

export interface FilterGroup {
  id: string
  combinator: FilterCombinator
  rules: FilterRule[]
}

export interface FilterConfig {
  groups: FilterGroup[]
  globalCombinator: FilterCombinator
}

/**
 * Field definition for filter builder UI
 */
export interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  options?: Array<{ value: string; label: string }>
  operators?: FilterOperator[]
}

/**
 * Saved view (user preference)
 */
export interface SavedView {
  id: string
  name: string
  filters: FilterConfig
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  columns?: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Quick filter (predefined)
 */
export interface QuickFilter {
  id: string
  label: string
  icon?: string
  filters: FilterConfig
  badge?: number // optional count
}
