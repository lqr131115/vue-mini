import { EMPTY_OBJ, NOOP, hasChanged, isObject } from '@vue/shared'
import { isReactive } from 'packages/reactivity/src/reactive'
import { isRef } from 'packages/reactivity/src/ref'
import { queuePreFlushCb } from './scheduler'
import { ReactiveEffect } from 'packages/reactivity/src/effect'

export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate
  deep?: boolean
}

export function watch<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: Function,
  options?: WatchOptions<Immediate>
) {
  return doWatch(source, cb, options)
}

function doWatch(
  source: any,
  cb: Function,
  { immediate, deep }: WatchOptions = EMPTY_OBJ
) {
  let getter: () => any

  if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isRef(source)) {
    getter = () => source.value
  } else {
    getter = NOOP
  }

  if (cb && deep) {
    const baseGetter = getter
    // traverse包裹 被动的(一定会)进行依赖收集
    getter = () => traverse(baseGetter())
  }

  let oldValue = null

  const job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    } else {
      // watchEffect
      effect.run()
    }
  }

  const scheduler = () => queuePreFlushCb(job)

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  return () => {
    effect.stop()
  }
}

export function traverse(value: unknown) {
  if (!isObject(value)) {
    return value
  }
  for (const key in value as object) {
    traverse((value as object)[key])
  }
  return value
}
