const NUMERIC_STATUS_MESSAGE =
  'Код статуса — член HTTP_STATUS из @shared/contract, а не число: setResponseStatus(event, HTTP_STATUS.ACCEPTED), status === HTTP_STATUS.NOT_FOUND, isServerErrorStatus(status)'

const NUMERIC_STATUS = 'Literal[raw=/^[1-5][0-9][0-9]$/]'

const STATUS_NAME = '/^(status|statusCode|httpStatusCode)$/'

const COMPARISON = 'BinaryExpression[operator=/^(===|!==|==|!=|<|<=|>|>=)$/]'

const STATUS_OPERAND = (side) => `:matches([${side}.name=${STATUS_NAME}], [${side}.property.name=${STATUS_NAME}])`

export const NUMERIC_HTTP_STATUS_RESTRICTIONS = [
  {
    selector: `CallExpression[callee.name=/^(setResponseStatus|endpoint)$/] > ${NUMERIC_STATUS}.arguments:nth-child(2)`,
    message: NUMERIC_STATUS_MESSAGE
  },
  {
    selector: `NewExpression[callee.name='ApiError'] > ${NUMERIC_STATUS}.arguments:first-child`,
    message: NUMERIC_STATUS_MESSAGE
  },
  {
    selector: `CallExpression[callee.type='MemberExpression'][callee.property.name=/^(status|code)$/] > ${NUMERIC_STATUS}.arguments`,
    message: NUMERIC_STATUS_MESSAGE
  },
  { selector: `Property[key.name=${STATUS_NAME}] > ${NUMERIC_STATUS}.value`, message: NUMERIC_STATUS_MESSAGE },
  {
    selector: `AssignmentExpression${STATUS_OPERAND('left')} > ${NUMERIC_STATUS}.right`,
    message: NUMERIC_STATUS_MESSAGE
  },
  { selector: `${COMPARISON}${STATUS_OPERAND('left')} > ${NUMERIC_STATUS}.right`, message: NUMERIC_STATUS_MESSAGE },
  { selector: `${COMPARISON}${STATUS_OPERAND('right')} > ${NUMERIC_STATUS}.left`, message: NUMERIC_STATUS_MESSAGE },
  {
    selector: `CallExpression[callee.property.name=/^(toBe|toEqual|toStrictEqual)$/][callee.object.callee.name='expect'][callee.object.arguments.0.callee.property.name='status'] > ${NUMERIC_STATUS}.arguments`,
    message: NUMERIC_STATUS_MESSAGE
  },
  {
    selector: `CallExpression[callee.property.name=/^(toBe|toEqual|toStrictEqual)$/][callee.object.callee.name='expect'][callee.object.arguments.0.property.name=${STATUS_NAME}] > ${NUMERIC_STATUS}.arguments`,
    message: NUMERIC_STATUS_MESSAGE
  }
]
