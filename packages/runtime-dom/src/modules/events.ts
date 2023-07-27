import { hyphenate } from '@vue/shared'

interface Invoker extends EventListener {
  value: Function
}

export function addEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  el.addEventListener(event, handler, options)
}

export function removeEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  el.removeEventListener(event, handler, options)
}

export function patchEvent(
  el: Element & { _vei?: Object },
  rawName: string,
  prevValue: any,
  nextValue: any
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]

  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    const [name] = parseName(rawName)
    if (nextValue) {
      // add
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      addEventListener(el, name, invoker)
    } else if (existingInvoker) {
      // remove
      removeEventListener(el, name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function parseName(name: string): [string] {
  return [hyphenate(name.slice(2))]
}

function createInvoker(initialValue: Function) {
  const invoker: Invoker = (e: Event) => {
    invoker.value && invoker.value()
  }
  invoker.value = initialValue
  return invoker
}
