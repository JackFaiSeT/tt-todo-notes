import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import stylelint from 'stylelint'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))

const WEB_CONFIG_FILE = `${ROOT}stylelint.config.mjs`

const COMPONENT_FILE = `${ROOT}src/shared/uikit/components/ui-button/styles/ui-button.scss`

const COLORS_FILE = `${ROOT}src/shared/assets/styles/global/colors.scss`

const SCALE_FILE = `${ROOT}src/shared/assets/styles/global/scale.scss`

const UNIT_RULES = new Set(['unit-disallowed-list', 'media-feature-name-unit-allowed-list'])

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`

const ruleIdsOf = async (code: string, codeFilename: string, configFile = WEB_CONFIG_FILE): Promise<string[]> => {
  const { results } = await stylelint.lint({ code, codeFilename, configFile })

  return (results[0]?.warnings ?? []).map((warning) => warning.rule)
}

const unitRuleIdsOf = async (code: string, codeFilename: string): Promise<string[]> =>
  (await ruleIdsOf(code, codeFilename)).filter((ruleId) => UNIT_RULES.has(ruleId))

describe('Config/stylelint', () => {
  beforeAll(async () => {
    await stylelint.resolveConfig(COMPONENT_FILE, { configFile: WEB_CONFIG_FILE })
  }, 60_000)

  describe('web', () => {
    it.each([
      ['hex color', lines('.ui-button {', '  color: #00909c;', '}'), 'color-no-hex'],
      ['named color', lines('.ui-button {', '  color: white;', '}'), 'color-named'],
      ['px in sizes', lines('.ui-button {', '  padding: 12px;', '}'), 'unit-disallowed-list'],
      ['px as root font size outside scale.scss', lines('html {', '  font-size: 10px;', '}'), 'unit-disallowed-list'],
      [
        'rem in media queries',
        lines('@media (width >= 76.8rem) {', '  .ui-button {', '    padding: 1.2rem;', '  }', '}'),
        'media-feature-name-unit-allowed-list'
      ],
      ['class outside BEM', lines('.uiButton {', '  padding: 1.2rem;', '}'), 'selector-class-pattern'],
      [
        'SCSS variable outside SCREAMING_SNAKE',
        lines('$gap: 1.2rem;', '', '.ui-button {', '  padding: $gap;', '}'),
        'scss/dollar-variable-pattern'
      ]
    ])('should report a style violation when component styles contain %s', async (_kind, code, rule) => {
      expect(await ruleIdsOf(code, COMPONENT_FILE)).toContain(rule)
    })

    it('should accept a hex color when it defines a palette token', async () => {
      expect(await ruleIdsOf(lines(':root {', '  --color-brand: #00909c;', '}'), COLORS_FILE)).toEqual([])
    })

    it('should accept pixels when component styles declare borders, outlines, text thresholds or media queries', async () => {
      const ruleIds = await unitRuleIdsOf(
        lines(
          '.ui-button {',
          '  border: 1px solid var(--color-border);',
          '  outline: 2px solid var(--color-focus-ring);',
          '  outline-offset: 2px;',
          '  font-size: max(1.6rem, 14px);',
          '',
          '  @media (width < 768px) {',
          '    padding: 1.2rem;',
          '  }',
          '}'
        ),
        COMPONENT_FILE
      )

      expect(ruleIds).toEqual([])
    })

    it('should accept pixels when scale.scss defines the root font size', async () => {
      const ruleIds = await unitRuleIdsOf(
        lines('@media (width < 360px) {', '  html {', '    font-size: 9.6px;', '  }', '}'),
        SCALE_FILE
      )

      expect(ruleIds).toEqual([])
    })
  })
})
