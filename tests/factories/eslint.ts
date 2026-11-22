import type { Linter } from 'eslint'

export const virtualSourceConfig: Linter.Config = {
  files: ['src/**/*.{vue,ts}'],
  languageOptions: { parserOptions: { projectService: false } },
  rules: {
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'off'
  }
}
