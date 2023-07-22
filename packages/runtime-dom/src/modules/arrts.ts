import { isSpecialBooleanAttr, includeBooleanAttr } from '@vue/shared'

export function patchAttr(el: Element, key: string, value: any) {
  const isBoolean = isSpecialBooleanAttr(key)
  if (value == null || (isBoolean && !includeBooleanAttr(value))) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, isBoolean ? '' : value)
  }
}
