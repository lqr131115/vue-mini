export function patchClass(el: Element, val: string | null) {
  if (val == null) {
    el.removeAttribute('class')
  } else {
    el.className = val
  }
}
