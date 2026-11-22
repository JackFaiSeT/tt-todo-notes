import { describe, it, expect } from 'vitest'
import { createLayerRules } from '../../../../../scripts/checks/lib/layer-rules.mjs'
import {
  findPresentationViolations,
  findStyleViolations
} from '../../../../../scripts/checks/lib/presentation-rules.mjs'

const file = 'src/core/notes/components/common/card/index.vue'

const { resolveTarget } = createLayerRules(['notes'])

describe('Scripts/presentationRules', () => {
  it.each(['useAsyncData', 'useLazyAsyncData', 'useFetch', 'useNotesService', 'fetch', '$fetch', '$services'])(
    'should trace %s when a common component imports a loader indirectly',
    (name) => {
      const entries = [
        { file, source: '<script setup lang="ts">import { rows } from "./rows"</script>' },
        { file: file.replace('index.vue', 'rows.ts'), source: "export { rows } from '@notes/utils/read'" },
        { file: 'src/core/notes/utils/read.ts', source: 'export const rows = () => ' + name + '()' }
      ]

      expect(findPresentationViolations(entries, resolveTarget)).toContain(
        [file, entries[1]!.file, entries[2]!.file, name].join(' → ')
      )
    }
  )

  it('should allow a type dependency when the component consumes plain props', () => {
    expect(
      findPresentationViolations(
        [{ file, source: '<script setup lang="ts">import type { NotesService } from "@notes/service"</script>' }],
        resolveTarget
      )
    ).toEqual([])
  })

  it.each([
    ['.card { color: red }', ''],
    ["@use './styles/card';", undefined],
    ["@use './styles/another';", ''],
    ["@use './styles/card';", 'p { color: v-bind(color) }']
  ])('should reject %s when the SFC style is inline, missing or invalid', (style, external) => {
    expect(
      findStyleViolations(
        { file, source: '<template><p /></template><style lang="scss">' + style + '</style>' },
        () => external
      )
    ).toHaveLength(1)
  })

  it('should allow an adjacent stylesheet when the SFC only imports it', () => {
    expect(
      findStyleViolations({ file, source: '<style lang="scss">@use "./styles/card";</style>' }, () => '.card {}')
    ).toEqual([])
  })
})
