import { makeMap } from './makeMap'

export { makeMap }
export * from './shapeFlags'
export * from './domAttrConfig'

export const EMPTY_ARR = Object.freeze([])
export const EMPTY_OBJ: { readonly [key: string]: any } = {}
export const NOOP = () => {}

const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

export const isModelListener = (key: string) => key.startsWith('onUpdate:')

export const isArray = Array.isArray
export const isObject = (val: unknown): val is object =>
  val !== null && typeof val === 'object'
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'

export const hasChanged = (newVal: any, oldVal: any): boolean =>
  !Object.is(newVal, oldVal)
export const extend = Object.assign

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as any
}

const hyphenateRE = /\B([A-Z])/g
/**
 * 'AbCDFg'.replace(/\B([A-Z])/g, '-$1') ---> 'Ab-C-D-Fg'
 */
export const hyphenate = cacheStringFunction((str: string) =>
  str.replace(hyphenateRE, '-$1').toLowerCase()
)

const camelizeRE = /-(\w)/g
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

export const capitalize = cacheStringFunction(
  (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
)
