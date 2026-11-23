const ENUM_MESSAGE =
  'Перечисление — словарь as const во множественном числе, а не enum: export const ORDER_STATUSES = { … } as const'

const VALUE_OF_MESSAGE =
  'Тип из словаря — ValueOf<typeof DICT> из @shared/contract, а не (typeof DICT)[keyof typeof DICT]'

const DICTIONARY_INDEXED_ACCESS =
  "TSIndexedAccessType[objectType.type='TSTypeQuery'][indexType.type='TSTypeOperator'][indexType.operator='keyof'][indexType.typeAnnotation.type='TSTypeQuery']"

export const ENUMERATION_SYNTAX_RESTRICTIONS = [
  { selector: 'TSEnumDeclaration', message: ENUM_MESSAGE },
  { selector: DICTIONARY_INDEXED_ACCESS, message: VALUE_OF_MESSAGE }
]

export const restrictedSyntaxRule = (...restrictions) => ['error', ...ENUMERATION_SYNTAX_RESTRICTIONS, ...restrictions]
