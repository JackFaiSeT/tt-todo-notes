import { describe, expect, it } from 'vitest'
import { findCommentViolations } from '../../../../../scripts/checks/lib/comment-rules.mjs'

const lines = (...rows: string[]): string => rows.join('\n')

const reportedLines = (source: string, file: string): number[] =>
  findCommentViolations(source, file).map((violation: { line: number }) => violation.line)

describe('Scripts/commentRules', () => {
  describe('findCommentViolations', () => {
    it('should report a comment when TypeScript contains a line comment', () => {
      expect(findCommentViolations(lines('const total = 1', 'const sum = 2 // explains sum'), 'src/sum.ts')).toEqual([
        { file: 'src/sum.ts', line: 2, text: '// explains sum' }
      ])
    })

    it.each([
      { source: lines('/**', ' * JSDoc', ' */', 'export const a = 1'), file: 'src/a.mts', expected: [1] },
      { source: lines('const a = 1', '/* block */ const b = 2'), file: 'scripts/a.mjs', expected: [2] },
      { source: lines('const url = `${host}`', '// after template'), file: 'src/a.ts', expected: [2] },
      { source: lines('const pattern = /a\\/b/', '// after regex'), file: 'src/a.ts', expected: [2] }
    ])('should report comment text when $file contains block or line comments', ({ source, file, expected }) => {
      expect(reportedLines(source, file)).toEqual(expected)
    })

    it('should report a comment when a Vue template contains an HTML comment', () => {
      const source = lines(
        '<script setup lang="ts">',
        "const title = 'a'",
        '</script>',
        '',
        '<template>',
        '  <!-- promo block -->',
        '  <h1>{{ title }}</h1>',
        '</template>'
      )

      expect(reportedLines(source, 'src/app/pages/index.vue')).toEqual([6])
    })

    it('should report comments when Vue scripts and styles contain them', () => {
      const source = lines(
        '<script setup lang="ts">',
        'const title = 1 // note',
        '</script>',
        '',
        '<style lang="scss" scoped>',
        '.title {',
        '  // scss note',
        '  color: var(--color-text);',
        '}',
        '</style>'
      )

      expect(reportedLines(source, 'src/app/pages/index.vue')).toEqual([2, 7])
    })

    it('should report a comment when SCSS contains a block comment', () => {
      const source = lines('.card {', '  /* spacing */', '  padding: 1rem;', '}', '// trailing')

      expect(reportedLines(source, 'src/shared/assets/styles/card.scss')).toEqual([2, 5])
    })

    it('should report a comment when CSS contains a block comment', () => {
      expect(reportedLines(lines('/* theme */', '.a { color: var(--a); }'), 'src/assets/css/main.css')).toEqual([1])
    })

    it('should report a comment when YAML or Dockerfile contains a hash comment', () => {
      expect(
        reportedLines(lines('stages:', '  # build first', '  - build', 'image: node # pinned'), '.gitlab-ci.yml')
      ).toEqual([2, 4])

      expect(
        reportedLines(lines('FROM node:24', '# install deps', 'RUN pnpm install'), 'infra/docker/Dockerfile')
      ).toEqual([2])
    })

    it.each([
      { source: lines('set -e', '# explain'), file: 'infra/scripts/deploy/deploy.sh' },
      { source: lines('server {', '  # proxy', '}'), file: 'infra/nginx/site.conf' },
      { source: lines('NUXT_DATABASE_PATH=notes.sqlite', '# [database]'), file: 'infra/env/defaults.env' },
      { source: lines('node_modules', '# build output'), file: '.gitignore' }
    ])('should report a comment when parsing $file', ({ source, file }) => {
      expect(reportedLines(source, file)).toEqual([2])
    })

    it('should report a comment when a directive disables ESLint', () => {
      expect(reportedLines('// eslint-disable-next-line no-console', 'src/a.ts')).toEqual([1])
    })

    it('should report a shebang when it occurs below the first line', () => {
      expect(reportedLines(lines('set -e', '#!/bin/sh'), 'infra/scripts/setup.sh')).toEqual([2])
    })

    it('should report a Dockerfile directive when it follows an instruction', () => {
      expect(reportedLines(lines('FROM node:24', '# syntax=docker/dockerfile:1'), 'Dockerfile')).toEqual([2])
    })

    it.each([
      { source: "const link = 'https://example.test/path'", file: 'src/a.ts' },
      { source: 'const pattern = "a//b /* c */"', file: 'src/a.ts' },
      { source: 'const path = `//${host}/*`', file: 'src/a.ts' },
      { source: 'const nested = `${`//${a}`}`', file: 'src/a.ts' },
      { source: 'const ratio = total / count / 2', file: 'src/a.ts' },
      { source: 'const pattern = /^https?:\\/\\//u', file: 'src/a.ts' },
      { source: 'const glob = /[/*]+/', file: 'src/a.ts' },
      { source: '.hero { background: url(https://example.test/a.png); }', file: 'src/a.scss' },
      { source: ".hero { background: url('//cdn.test/a.png'); }", file: 'src/a.scss' },
      {
        source: lines('<template>', '  <a href="https://example.test/#top">{{ a }}</a>', '</template>'),
        file: 'src/a.vue'
      },
      { source: lines('url: "https://example.test/#anchor"', "color: '#00909c'", 'key: a#b'), file: 'a.yaml' },
      { source: lines('echo "$#"', 'echo "${#items[@]}"', 'echo ${#items[@]}'), file: 'a.sh' }
    ])('should ignore comment delimiters when $file contains the literal $source', ({ source, file }) => {
      expect(findCommentViolations(source, file)).toEqual([])
    })

    it('should report the statement separator when a SQL file is outside migrations', () => {
      expect(reportedLines('--> statement-breakpoint', 'src/server/database/query.sql')).toEqual([1])
    })

    it('should allow the statement separator when inspecting SQL comments', () => {
      expect(
        reportedLines(
          lines('SELECT 1;', '--> statement-breakpoint', '-- explanation'),
          'src/server/database/migrations/0000_notes.sql'
        )
      ).toEqual([3])
    })
  })
})
