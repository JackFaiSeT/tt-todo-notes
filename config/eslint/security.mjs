const UPPER_CASE_NAME = '/^[A-Z][A-Z0-9_]*$/'

const CONSTANT = `:matches(Identifier[name=${UPPER_CASE_NAME}], MemberExpression[computed=false][object.type='Identifier'][object.name=${UPPER_CASE_NAME}][property.name=${UPPER_CASE_NAME}])`

const CONSTANT_TEMPLATE = `TemplateLiteral:not(:has(> .expressions:not(${CONSTANT})))`

const CONSTANT_STRING = `CallExpression[callee.type='Identifier'][callee.name='String'][arguments.length=1]:not(:has(> .arguments:not(${CONSTANT})))`

const STATIC_VALUE = `:matches(Literal, ${CONSTANT_TEMPLATE}, ${CONSTANT}, ${CONSTANT_STRING})`

const SQL_RAW_CALL =
  "CallExpression[callee.type='MemberExpression'][callee.computed=false][callee.object.name='sql'][callee.property.name='raw']"

const REGEXP_CALL = ":matches(NewExpression, CallExpression)[callee.type='Identifier'][callee.name='RegExp']"

const CHILD_PROCESS_MODULE = '/^(node:)?child_process$/'

const SQL_RAW_MESSAGE =
  'sql.raw вставляет текст в запрос без параметров: аргумент — литерал, константа UPPER_CASE или String(КОНСТАНТА), значения передаются подстановкой в шаблон sql'

const REGEXP_MESSAGE =
  'Шаблон RegExp на сервере собирается только из литералов и констант UPPER_CASE: строка из запроса делает поиск уязвимым к ReDoS и подмене шаблона'

const CHILD_PROCESS_MESSAGE = 'Приложение не запускает процессы ОС: child_process в src запрещён'

export const CHILD_PROCESS_IMPORT_PATHS = ['child_process', 'node:child_process'].map((name) => ({
  name,
  message: CHILD_PROCESS_MESSAGE
}))

export const SERVER_SECURITY_RESTRICTIONS = [
  { selector: `${SQL_RAW_CALL} > .arguments:not(${STATIC_VALUE})`, message: SQL_RAW_MESSAGE },
  { selector: `${REGEXP_CALL} > .arguments:first-child:not(${STATIC_VALUE})`, message: REGEXP_MESSAGE },
  {
    selector: `ImportExpression[source.type='Literal'][source.value=${CHILD_PROCESS_MODULE}]`,
    message: CHILD_PROCESS_MESSAGE
  }
]

export const SERVER_EVAL_RULES = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error'
}
