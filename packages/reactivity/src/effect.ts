import { extend, isArray } from '@vue/shared'
import { Dep, createDep } from './dep'
import { ComputedRefImpl } from './computed'

type KeyToMap = Map<any, Dep>
export const targetMap = new WeakMap<any, KeyToMap>()

export let activeEffect: ReactiveEffect | undefined

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export class ReactiveEffect<T = any> {
  computed?: ComputedRefImpl<T>

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}

  run() {
    try {
      activeEffect = this
      return this.fn()
    } finally {
    }
  }

  stop() {}
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  if (options) {
    extend(_effect, options)
  }

  if (!options || !options.lazy) {
    _effect.run()
  }
}

/**
 * 依赖收集
 * @param target
 * @param key
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}

/**
 * 利用key 依此跟踪key的所以 effect
 * @param dep
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

/**
 * 依赖触发
 * @param target
 * @param key
 * @param newValue
 */
export function trigger(target: object, key?: unknown, newValue?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  let dep: Dep | undefined = depsMap.get(key)
  if (!dep) {
    return
  }
  triggerEffects(dep)
}

/**
 * 依此触发 dep 中保存的effect
 * @param dep
 */
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]

  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }

  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

/**
 * 触发单个 effect
 * @param effect
 */
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
