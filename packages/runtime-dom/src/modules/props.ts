import { includeBooleanAttr } from '@vue/shared'

export function patchDomProp(el: any, key: string, value: any) {
  if (key === 'value') {
    el._value = value
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      el.value = newValue
    }
    if (value == null) {
      el.removeAttribute(key)
    }
    return
  }
  let needRemove = false
  if (value == '' || value == null) {
    const type = typeof el[key]
    if (type === 'function') {
      value = includeBooleanAttr(value)
    } else if (type === 'string' && value == null) {
      value = ''
      needRemove = true
    } else if (type === 'number') {
      value = 0
      needRemove = true
    } else {
    }
  }
  try {
    el[key] = value
  } catch (e) {
    console.warn(
      `Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
        `value ${value} is invalid.`,
      e
    )
  }
  needRemove && el.removeAttribute(key)
}
