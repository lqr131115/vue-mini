import { NOOP } from '@vue/shared'
import { VNode } from './vnode'

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
    update: null
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
  } else {
    finishComponentSetup(instance)
  }
}

export function finishComponentSetup(instance) {
  const Component = instance.type

  if (!instance.render) {
    instance.render = Component.render || NOOP
  }
}
