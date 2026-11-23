import { describe, expect, it } from 'vitest'
import { findReactivityViolations } from '../../../../../scripts/checks/lib/reactivity-rules.mjs'
import { buildVueSource, toSource } from '../../../../factories/script-source'

const FILE = 'src/shared/composables/useSample.ts'

describe('Scripts/reactivityRules', () => {
  describe('findReactivityViolations', () => {
    it.each([
      { source: 'const total = computed(() => 1)', kinds: ['untyped computed'] },
      { source: 'const state = reactive<State>({})', kinds: ['reactive<T> generic'] },
      {
        source: 'const state = shallowReactive({}) as State',
        kinds: ['untyped shallowReactive', 'shallowReactive(…) cast']
      },
      { source: 'const state: State = reactive({ a: 1 }) satisfies State', kinds: ['reactive(…) cast'] }
    ])('should report $kinds when the code is "$source"', ({ source, kinds }) => {
      expect(findReactivityViolations(source, FILE).map((violation: { kind: unknown }) => violation.kind)).toEqual(
        kinds
      )
    })

    it('should report the call when it occurs inside a Vue script', () => {
      const source = buildVueSource('const isOpen = ref(false)')

      expect(findReactivityViolations(source, 'src/shared/components/sample.vue')).toHaveLength(1)
    })

    it('should ignore template expressions when checking a Vue script', () => {
      const source = buildVueSource('const label = computed<string>(() => "")', '<div>{{ ref(0) }}</div>')

      expect(findReactivityViolations(source, 'src/shared/components/sample.vue')).toEqual([])
    })

    it('should include the line number and source when reporting a call', () => {
      expect(findReactivityViolations(toSource("import { ref } from 'vue'", '', '  const a = ref(0)'), FILE)).toEqual([
        { file: FILE, line: 3, kind: 'untyped ref', text: 'const a = ref(0)' }
      ])
    })

    it.each([
      { source: 'const total = computed<number>(() => 1)', label: 'a typed computed' },
      { source: 'const state: State = reactive({ a: 1 })', label: 'reactive typed through the variable' },
      { source: "const label = 'ref(0) and computed(() => 1)'", label: 'factory calls inside a string' },
      { source: 'store.ref(1)', label: 'a method named like a factory' }
    ])('should allow the source when it uses $label', ({ source }) => {
      expect(findReactivityViolations(source, FILE)).toEqual([])
    })
  })
})
