import { API_ROUTE_PATTERN } from './constants'

export const isApiRoute = (path: string): boolean => API_ROUTE_PATTERN.test(path)
