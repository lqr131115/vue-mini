import { ShapeFlags } from '@vue/shared'
import { Text, Comment, Fragment } from './vnode'

export interface RendererOptions {
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  setElementText(node: Element, text: string): void
  insert(el: any, parent: Element, anchor?: null): void
  createElement(type: string): Element
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

export function baseCreateRenderer(options: RendererOptions): any {
  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }
    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        break
      case Comment:
        break
      case Fragment:
        break
      default:
        break
    }

    if (shapeFlag & ShapeFlags.ELEMENT) {
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
    } else {
      console.warn('Invalid VNode type:', type, `(${typeof type})`)
    }
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      // TODO: unmount
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}
