import { NOOP, isFunction } from '@vue/shared'
import { VNode } from './vnode'
import { applyOptions } from './componentOptions'

let uid = 0
export function createComponentInstance(vnode: VNode) {
  const type = vnode.type
  const instance = {
    uid: uid++,
    vnode,
    type,
    render: null,
    subTree: null,
    effect: null,
    update: null,
    bc: null,
    c: null,
    bm: null,
    m: null
  }
  return instance
}

export function setupComponent(instance) {
  return setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  const { setup } = Component

  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}

export function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  }
  finishComponentSetup(instance)
}

export function finishComponentSetup(instance) {
  const Component = instance.type

  if (!instance.render) {
    instance.render = Component.render || NOOP
  }

  applyOptions(instance)
}

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}
