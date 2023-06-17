import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const result = Reflect.get(target, key, receiver)
    track(target, key)
    return result
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    newVal: unknown,
    receiver: object
  ) {
    const result = Reflect.set(target, key, newVal, receiver)
    trigger(target, key, newVal)
    return result
  }
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set
}
