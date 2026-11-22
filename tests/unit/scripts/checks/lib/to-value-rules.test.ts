import { describe, expect, it } from 'vitest'
import { findToValueViolations } from '../../../../../scripts/checks/lib/to-value-rules.mjs'
import { toEntry, toSource } from '../../../../factories/script-source'

describe('Scripts/toValueRules', () => {
  describe('findToValueViolations', () => {
    it.each([
      { source: 'const next = count.value + 1', label: 'a read in an expression' },
      { source: 'return profile?.value', label: 'an optional read' },
      { source: 'const same = count.value === 1', label: 'a comparison' },
      { source: 'const item = iterator.next().value', label: 'an arbitrary next result' },
      { source: 'const item = source.values().next(arg).value', label: 'a nonstandard next call' },
      { source: 'const item = source.values().next().value.value', label: 'a ref returned by an iterator' },
      { source: 'const item = source.value.values().next().value', label: 'a ref used as an iterator receiver' }
    ])('should report the violation when the source contains $label', ({ source }) => {
      expect(findToValueViolations(toEntry(source))).toHaveLength(1)
    })

    it('should include the line number and source when reporting a read', () => {
      expect(findToValueViolations(toEntry(toSource('const a = 1', '  use(count.value)')))).toEqual([
        { file: 'src/shared/utils/sample.ts', line: 2, text: 'use(count.value)' }
      ])
    })

    it.each([
      { source: 'count.value = 1', label: 'an assignment' },
      { source: 'count.value += 1', label: 'a compound assignment' },
      { source: 'count.value++', label: 'an increment' },
      { source: '++count.value', label: 'a prefix increment' },
      { source: 'items.value.push(item)', label: 'a mutating call' },
      { source: 'state.value.name = name', label: 'a nested write' },
      { source: 'const text = (event.target as HTMLInputElement).value', label: 'a DOM element value' },
      { source: 'const text = input.value', label: 'an input value' },
      { source: 'const flag = binding.value', label: 'a directive binding value' },
      { source: 'active.values().next().value?.update()', label: 'a Map values IteratorResult read' },
      { source: 'const item = active?.values()?.next()?.value', label: 'an optional iterator chain' },
      { source: 'const item = active.values()\n  .next().value', label: 'a multiline iterator chain' },
      { source: "const label = 'count.value'", label: 'a read inside a string' }
    ])('should allow the source when it uses $label', ({ source }) => {
      expect(findToValueViolations(toEntry(source))).toEqual([])
    })
  })
})
