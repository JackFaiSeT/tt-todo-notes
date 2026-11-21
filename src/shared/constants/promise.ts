export const SETTLED_STATUSES = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
} as const satisfies Record<string, PromiseSettledResult<unknown>['status']>
