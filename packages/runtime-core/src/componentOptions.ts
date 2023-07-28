import { reactive } from '@vue/reactivity'
import { LifecycleHooks } from './component'
import { isArray } from '@vue/shared'
import { onBeforeMount, onMounted } from './apiLifecycle'

export function applyOptions(instance: any) {
  const options = resolveMergedOptions(instance)

  if (options.beforeCreate) {
    callHook(options.beforeCreate, instance, LifecycleHooks.BEFORE_CREATE)
  }

  const { data: dataOptions, created, beforeMount, mounted } = options
  if (dataOptions) {
    const data = dataOptions()
    instance.data = reactive(data)
  }

  if (created) {
    callHook(created, instance, LifecycleHooks.CREATED)
  }

  function registerLifecycleHook(
    register: Function,
    hook?: Function | Function[]
  ) {
    if (isArray(hook)) {
      hook.forEach(_hook => register(_hook, instance))
    } else if (hook) {
      register(hook, instance)
    }
  }

  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
}

function callHook(hook: Function, instance: any, type: LifecycleHooks) {
  hook()
}

export function resolveMergedOptions(instance: any) {
  const base = instance.type
  return base
}
