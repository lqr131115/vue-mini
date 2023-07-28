import { ShapeFlags } from '@vue/shared'
import { normalizeVNode } from './vnode'

export function renderComponentRoot(instance) {
  const { vnode, render, data } = instance
  let result
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    try {
      result = normalizeVNode(render!.call(data))
    } catch (error) {
      console.error(error)
    }
  } else {
  }
  return result
}
