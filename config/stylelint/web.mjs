import { fileURLToPath } from 'node:url'

const resolvePackage = (name) => fileURLToPath(import.meta.resolve(name))

const BEM_CLASS_PATTERN = '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$'

const SCSS_VARIABLE_PATTERN = '^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$'

export const COLOR_TOKENS_FILE = 'src/shared/assets/styles/global/colors.scss'

export const SCALE_FILE = 'src/shared/assets/styles/global/scale.scss'

const PX_VARIABLE_FILES = [
  'src/shared/assets/styles/global/vars.scss',
  'src/shared/assets/styles/global/typography.scss'
]

const SCSS_VARIABLE_DECLARATION = '/^\\$/'

const PX_PROPERTIES = ['/^border/', '/^outline/']

const PX_FUNCTIONS = ['max']

const PX_MEDIA_FEATURES = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height']

const PX_MESSAGE =
  'Размеры — в rem по шкале src/shared/assets/styles/global/scale.scss; px — только у border, outline, порога текста max(<rem>, <px>) и в медиазапросах'

const pxRule = (properties) => [
  'px',
  {
    ignoreProperties: { px: properties },
    ignoreFunctions: PX_FUNCTIONS,
    ignoreMediaFeatureNames: { px: PX_MEDIA_FEATURES },
    message: () => PX_MESSAGE
  }
]

export default {
  extends: [resolvePackage('stylelint-config-standard-scss'), resolvePackage('stylelint-config-idiomatic-order')],
  rules: {
    'selector-class-pattern': [
      BEM_CLASS_PATTERN,
      {
        resolveNestedSelectors: true,
        message: (selector) => `Класс ${selector} не по BEM: block, block__element, block--modifier в kebab-case`
      }
    ],
    'scss/dollar-variable-pattern': [
      SCSS_VARIABLE_PATTERN,
      { ignore: 'local', message: (name) => `SCSS-переменная $${name} — в $SCREAMING_SNAKE` }
    ],
    'color-no-hex': [true, { message: () => `Цвет задаётся токеном из ${COLOR_TOKENS_FILE}, а не литералом` }],
    'color-named': ['never', { message: () => `Цвет задаётся токеном из ${COLOR_TOKENS_FILE}, а не именем` }],
    'unit-disallowed-list': pxRule(PX_PROPERTIES),
    'media-feature-name-unit-allowed-list': [
      { '/(width|height)$/': ['px'] },
      { message: () => 'Медиазапрос — в px: корневой размер шрифта меняется, медиазапрос — нет' }
    ],
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['deep', 'global', 'slotted'] }],
    'declaration-empty-line-before': null,
    'no-descending-specificity': null
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: resolvePackage('postcss-html')
    },
    {
      files: [`**/${COLOR_TOKENS_FILE}`],
      rules: {
        'color-no-hex': null,
        'color-named': null
      }
    },
    {
      files: PX_VARIABLE_FILES.map((file) => `**/${file}`),
      rules: {
        'unit-disallowed-list': pxRule([...PX_PROPERTIES, SCSS_VARIABLE_DECLARATION])
      }
    },
    {
      files: [`**/${SCALE_FILE}`],
      rules: {
        'unit-disallowed-list': pxRule([...PX_PROPERTIES, 'font-size'])
      }
    }
  ]
}
