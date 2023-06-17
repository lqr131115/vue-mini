export * from './shapeFlags'

export const EMPTY_OBJ: { readonly [key: string]: any } = {}
export const NOOP = () => {}

export const isArray = Array.isArray
export const isObject = (val: unknown): val is object =>
  val !== null && typeof val === 'object'
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'

export const hasChanged = (newVal: any, oldVal: any): boolean =>
  !Object.is(newVal, oldVal)
export const extend = Object.assign
