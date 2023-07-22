import { makeMap } from './makeMap'

const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`
export const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs)

export function includeBooleanAttr(value: unknown): boolean {
  return !!value || value === ''
}
