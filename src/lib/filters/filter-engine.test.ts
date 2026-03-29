import { describe, it, expect } from 'vitest'
import {
  applyFilters,
  countMatches,
  hasActiveFilters,
  clearFilters,
  addQuickFilter,
  removeRule,
} from './filter-engine'
import type { FilterConfig } from './filter-types'

const EMPTY_CONFIG: FilterConfig = { groups: [], globalCombinator: 'AND' }

const items = [
  { id: '1', name: 'Alice', status: 'ACTIVE', score: 80, tags: ['js', 'ts'], client: { companyName: 'Acme' } },
  { id: '2', name: 'Bob', status: 'INACTIVE', score: 50, tags: ['python'], client: { companyName: 'Beta' } },
  { id: '3', name: 'Charlie', status: 'ACTIVE', score: 90, tags: ['js'], client: { companyName: 'Acme' } },
  { id: '4', name: 'Diana', status: 'ARCHIVED', score: 0, tags: [], client: { companyName: '' } },
]

function makeConfig(
  field: string,
  operator: FilterConfig['groups'][0]['rules'][0]['operator'],
  value: FilterConfig['groups'][0]['rules'][0]['value']
): FilterConfig {
  return {
    groups: [{ id: 'g1', combinator: 'AND', rules: [{ id: 'r1', field, operator, value }] }],
    globalCombinator: 'AND',
  }
}

describe('applyFilters', () => {
  it('returns all items when no groups', () => {
    expect(applyFilters(items, EMPTY_CONFIG)).toHaveLength(4)
  })

  it('eq — filters by exact match', () => {
    const result = applyFilters(items, makeConfig('status', 'eq', 'ACTIVE'))
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toEqual(['Alice', 'Charlie'])
  })

  it('ne — filters out exact match', () => {
    const result = applyFilters(items, makeConfig('status', 'ne', 'ACTIVE'))
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toEqual(['Bob', 'Diana'])
  })

  it('contains — case-insensitive substring match', () => {
    const result = applyFilters(items, makeConfig('name', 'contains', 'ali'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('notContains — excludes substring match', () => {
    const result = applyFilters(items, makeConfig('name', 'notContains', 'a'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bob')
  })

  it('startsWith — prefix match', () => {
    const result = applyFilters(items, makeConfig('name', 'startsWith', 'Ch'))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Charlie')
  })

  it('endsWith — suffix match', () => {
    const result = applyFilters(items, makeConfig('name', 'endsWith', 'e'))
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toEqual(['Alice', 'Charlie'])
  })

  it('gt — greater than', () => {
    const result = applyFilters(items, makeConfig('score', 'gt', 80))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Charlie')
  })

  it('gte — greater than or equal', () => {
    const result = applyFilters(items, makeConfig('score', 'gte', 80))
    expect(result).toHaveLength(2)
  })

  it('lt — less than', () => {
    const result = applyFilters(items, makeConfig('score', 'lt', 50))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Diana')
  })

  it('lte — less than or equal', () => {
    const result = applyFilters(items, makeConfig('score', 'lte', 50))
    expect(result).toHaveLength(2)
  })

  it('in — value in array', () => {
    const result = applyFilters(items, makeConfig('status', 'in', ['ACTIVE', 'ARCHIVED']))
    expect(result).toHaveLength(3)
  })

  it('notIn — value not in array', () => {
    const result = applyFilters(items, makeConfig('status', 'notIn', ['ACTIVE']))
    expect(result).toHaveLength(2)
  })

  it('isEmpty — matches null/undefined/empty string', () => {
    const result = applyFilters(items, makeConfig('client.name', 'isEmpty', null))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Diana')
  })

  it('isNotEmpty — excludes null/undefined/empty string', () => {
    const result = applyFilters(items, makeConfig('client.name', 'isNotEmpty', null))
    expect(result).toHaveLength(3)
  })

  it('nested dot notation — client.name maps to client.companyName', () => {
    const result = applyFilters(items, makeConfig('client.name', 'eq', 'Acme'))
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toEqual(['Alice', 'Charlie'])
  })

  it('nested dot notation — client.companyName', () => {
    const result = applyFilters(items, makeConfig('client.companyName', 'eq', 'Acme'))
    expect(result).toHaveLength(2)
    expect(result.map(i => i.name)).toEqual(['Alice', 'Charlie'])
  })

  it('null field — returns no match for non-empty operators', () => {
    const data = [{ id: '1', score: null }]
    const result = applyFilters(data, makeConfig('score', 'gt', 0))
    expect(result).toHaveLength(0)
  })

  it('AND combinator — all rules must match', () => {
    const config: FilterConfig = {
      groups: [{
        id: 'g1',
        combinator: 'AND',
        rules: [
          { id: 'r1', field: 'status', operator: 'eq', value: 'ACTIVE' },
          { id: 'r2', field: 'score', operator: 'gte', value: 80 },
        ],
      }],
      globalCombinator: 'AND',
    }
    const result = applyFilters(items, config)
    expect(result).toHaveLength(2)
  })

  it('OR combinator — any rule must match', () => {
    const config: FilterConfig = {
      groups: [{
        id: 'g1',
        combinator: 'OR',
        rules: [
          { id: 'r1', field: 'status', operator: 'eq', value: 'ARCHIVED' },
          { id: 'r2', field: 'score', operator: 'gte', value: 80 },
        ],
      }],
      globalCombinator: 'AND',
    }
    const result = applyFilters(items, config)
    expect(result).toHaveLength(3) // Alice (80), Charlie (90), Diana (ARCHIVED)
  })

  it('multi-group AND — all groups must match', () => {
    const config: FilterConfig = {
      groups: [
        { id: 'g1', combinator: 'AND', rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'ACTIVE' }] },
        { id: 'g2', combinator: 'AND', rules: [{ id: 'r2', field: 'score', operator: 'gt', value: 85 }] },
      ],
      globalCombinator: 'AND',
    }
    const result = applyFilters(items, config)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Charlie')
  })

  it('multi-group OR — any group can match', () => {
    const config: FilterConfig = {
      groups: [
        { id: 'g1', combinator: 'AND', rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'ARCHIVED' }] },
        { id: 'g2', combinator: 'AND', rules: [{ id: 'r2', field: 'score', operator: 'gt', value: 85 }] },
      ],
      globalCombinator: 'OR',
    }
    const result = applyFilters(items, config)
    expect(result).toHaveLength(2) // Diana (ARCHIVED) + Charlie (score > 85)
  })
})

describe('countMatches', () => {
  it('returns correct count', () => {
    expect(countMatches(items, makeConfig('status', 'eq', 'ACTIVE'))).toBe(2)
  })

  it('returns total count when no filters', () => {
    expect(countMatches(items, EMPTY_CONFIG)).toBe(4)
  })
})

describe('hasActiveFilters', () => {
  it('returns false for empty config', () => {
    expect(hasActiveFilters(EMPTY_CONFIG)).toBe(false)
  })

  it('returns true when group has rules', () => {
    expect(hasActiveFilters(makeConfig('status', 'eq', 'ACTIVE'))).toBe(true)
  })
})

describe('clearFilters', () => {
  it('returns empty config', () => {
    const cleared = clearFilters()
    expect(cleared.groups).toHaveLength(0)
    expect(cleared.globalCombinator).toBe('AND')
  })
})

describe('addQuickFilter', () => {
  it('creates a new group when config has none', () => {
    const result = addQuickFilter(EMPTY_CONFIG, 'status', 'eq', 'ACTIVE')
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].rules).toHaveLength(1)
    expect(result.groups[0].rules[0].field).toBe('status')
  })

  it('appends to first group when one exists', () => {
    const config = addQuickFilter(EMPTY_CONFIG, 'status', 'eq', 'ACTIVE')
    const result = addQuickFilter(config, 'score', 'gt', 80)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].rules).toHaveLength(2)
  })

  it('preserves existing groups beyond the first', () => {
    const config: FilterConfig = {
      groups: [
        { id: 'g1', combinator: 'AND', rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'ACTIVE' }] },
        { id: 'g2', combinator: 'AND', rules: [{ id: 'r2', field: 'name', operator: 'contains', value: 'Alice' }] },
      ],
      globalCombinator: 'AND',
    }
    const result = addQuickFilter(config, 'score', 'gt', 50)
    expect(result.groups).toHaveLength(2)
    expect(result.groups[0].rules).toHaveLength(2)
    expect(result.groups[1].rules).toHaveLength(1)
  })
})

describe('removeRule', () => {
  it('removes the specified rule', () => {
    const config = addQuickFilter(addQuickFilter(EMPTY_CONFIG, 'status', 'eq', 'ACTIVE'), 'score', 'gt', 50)
    const ruleId = config.groups[0].rules[0].id
    const result = removeRule(config, ruleId)
    expect(result.groups[0].rules).toHaveLength(1)
    expect(result.groups[0].rules[0].field).toBe('score')
  })

  it('removes the group when its last rule is removed', () => {
    const config = addQuickFilter(EMPTY_CONFIG, 'status', 'eq', 'ACTIVE')
    const ruleId = config.groups[0].rules[0].id
    const result = removeRule(config, ruleId)
    expect(result.groups).toHaveLength(0)
  })

  it('is a no-op for unknown rule id', () => {
    const config = addQuickFilter(EMPTY_CONFIG, 'status', 'eq', 'ACTIVE')
    const result = removeRule(config, 'nonexistent')
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].rules).toHaveLength(1)
  })
})
