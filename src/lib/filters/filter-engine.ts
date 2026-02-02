/**
 * Client-side filter engine
 * Applies filters to in-memory data for instant filtering
 */

import type { FilterRule, FilterGroup, FilterConfig, FilterOperator } from './filter-types'

/**
 * Apply a single filter rule to a value
 */
function applyRule(value: any, rule: FilterRule): boolean {
  const { operator, value: filterValue } = rule

  // Handle empty checks first
  if (operator === 'isEmpty') {
    return value === null || value === undefined || value === ''
  }
  if (operator === 'isNotEmpty') {
    return value !== null && value !== undefined && value !== ''
  }

  // If value is empty and operator isn't isEmpty/isNotEmpty, return false
  if (value === null || value === undefined) {
    return false
  }

  // Convert to string for text operations
  const strValue = String(value).toLowerCase()
  const strFilterValue = filterValue ? String(filterValue).toLowerCase() : ''

  switch (operator) {
    case 'eq':
      return value === filterValue
    case 'ne':
      return value !== filterValue
    case 'contains':
      return strValue.includes(strFilterValue)
    case 'notContains':
      return !strValue.includes(strFilterValue)
    case 'startsWith':
      return strValue.startsWith(strFilterValue)
    case 'endsWith':
      return strValue.endsWith(strFilterValue)
    case 'gt':
      return Number(value) > Number(filterValue)
    case 'gte':
      return Number(value) >= Number(filterValue)
    case 'lt':
      return Number(value) < Number(filterValue)
    case 'lte':
      return Number(value) <= Number(filterValue)
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value)
    case 'notIn':
      return Array.isArray(filterValue) && !filterValue.includes(value)
    default:
      return true
  }
}

/**
 * Apply a filter group to an item
 */
function applyGroup(item: any, group: FilterGroup): boolean {
  if (group.rules.length === 0) return true

  const results = group.rules.map(rule => {
    const value = getNestedValue(item, rule.field)
    return applyRule(value, rule)
  })

  return group.combinator === 'AND'
    ? results.every(r => r)
    : results.some(r => r)
}

/**
 * Get nested value from object using dot notation
 * e.g., "client.name" from { client: { name: "Acme" } }
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Apply full filter configuration to an array of items
 */
export function applyFilters<T>(items: T[], config: FilterConfig): T[] {
  if (config.groups.length === 0) return items

  return items.filter(item => {
    const results = config.groups.map(group => applyGroup(item, group))
    
    return config.globalCombinator === 'AND'
      ? results.every(r => r)
      : results.some(r => r)
  })
}

/**
 * Count items that match filters
 */
export function countMatches<T>(items: T[], config: FilterConfig): number {
  return applyFilters(items, config).length
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(config: FilterConfig): boolean {
  return config.groups.some(group => group.rules.length > 0)
}

/**
 * Clear all filters
 */
export function clearFilters(): FilterConfig {
  return {
    groups: [],
    globalCombinator: 'AND',
  }
}

/**
 * Add a quick filter
 */
export function addQuickFilter(
  config: FilterConfig,
  field: string,
  operator: FilterOperator,
  value: any
): FilterConfig {
  const newRule: FilterRule = {
    id: `rule-${Date.now()}`,
    field,
    operator,
    value,
  }

  // If no groups exist, create one
  if (config.groups.length === 0) {
    return {
      ...config,
      groups: [{
        id: `group-${Date.now()}`,
        combinator: 'AND',
        rules: [newRule],
      }],
    }
  }

  // Add to first group
  return {
    ...config,
    groups: [
      {
        ...config.groups[0],
        rules: [...config.groups[0].rules, newRule],
      },
      ...config.groups.slice(1),
    ],
  }
}

/**
 * Remove a filter rule
 */
export function removeRule(config: FilterConfig, ruleId: string): FilterConfig {
  return {
    ...config,
    groups: config.groups
      .map(group => ({
        ...group,
        rules: group.rules.filter(rule => rule.id !== ruleId),
      }))
      .filter(group => group.rules.length > 0),
  }
}
