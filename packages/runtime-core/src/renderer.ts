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
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert
  } = options

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountElement(newVNode, container, anchor)
    } else {
      // todo: update
      patchElement(oldVNode, newVNode, container, anchor)
    }
  }

  const processText = (oldVNode, newVNode, container, anchor) => {}

  const processCommentNode = (oldVNode, newVNode, container, anchor) => {}

  const processFragment = (oldVNode, newVNode, container, anchor) => {}

  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode

    // 1. crateElement
    const el = (vnode.el = hostCreateElement(type))
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // todo mountChildren
    }

    // 2. 设置props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 3. 插入
    hostInsert(el, container, anchor)
  }

  const patchElement = (oldVNode, newVNode, container, anchor) => {}

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }
    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor)
        break
      case Comment:
        processCommentNode(oldVNode, newVNode, container, anchor)
        break
      case Fragment:
        processFragment(oldVNode, newVNode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
        } else {
          console.warn('Invalid VNode type:', type, `(${typeof type})`)
        }
        break
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
