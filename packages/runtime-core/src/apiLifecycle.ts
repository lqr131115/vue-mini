import { LifecycleHooks } from './component'

export const createHook = (lifecycle: LifecycleHooks) => {
  return (hook, target) => injectHook(lifecycle, hook, target)
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

export function injectHook(type: LifecycleHooks, hook: Function, target: any) {
  if (target) {
    target[type] = hook
    return hook
  }
}
