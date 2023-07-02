import { EMPTY_OBJ, ShapeFlags } from '@vue/shared'
import { Text, Comment, Fragment, isSameVNodeType } from './vnode'

export interface RendererOptions {
  insert(el: Element, parent: Element, anchor?: null): void
  remove(el: Element): void
  setElementText(el: Element, text: string): void
  createElement(type: string): Element
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

export function baseCreateRenderer(options: RendererOptions): any {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp
  } = options

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountElement(newVNode, container, anchor)
    } else {
      patchElement(oldVNode, newVNode)
    }
  }

  const processText = () => {}

  const processCommentNode = () => {}

  const processFragment = () => {}

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

  const patchElement = (oldVNode, newVNode) => {
    const el = (newVNode.el = oldVNode.el!)
    const oldProps = oldVNode.props || EMPTY_OBJ
    const newProps = newVNode.props || EMPTY_OBJ

    patchChildren(oldVNode, newVNode, el, null)

    patchProps(el, newVNode, oldProps, newProps)
  }

  const patchChildren = (oldVNode, newVNode, container, anchor) => {
    const oldChildren = oldVNode && oldVNode.children
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0
    const newChildren = newVNode.children
    const { shapeFlag } = newVNode

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      /**
       * new children is text
       * old children is array
       */
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        hostSetElementText(container, newChildren)
      }

      /**
       * new children is text
       * old children is text or null
       */
      if (newChildren !== oldChildren) {
        hostSetElementText(container, newChildren)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        /**
         * new children is array
         * old children is array
         */
        if (shapeFlag & shapeFlag.ARRAY_CHILDREN) {
        } else {
          /**
           * new children is text or null
           * old children is array
           */
        }
      } else {
        /**
         * new children is array or null
         * old children is text
         */
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        }

        /**
         * new children is array
         * old children is text or null
         */
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        }
      }
    }
  }

  const patchProps = (el, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    } else {
    }
  }

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }

    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      // 卸载之前的
      unmount(oldVNode, true)
      oldVNode = null
    }

    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        processText()
        break
      case Comment:
        processCommentNode()
        break
      case Fragment:
        processFragment()
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

  const unmount = (vnode, doRemove = false) => {
    const { shapeFlag } = vnode

    if (shapeFlag & ShapeFlags.COMPONENT) {
      // unmountComponent
    } else {
      if (doRemove) {
        remove(vnode)
      }
    }
  }

  const remove = vnode => {
    const { el } = vnode

    const performRemove = () => {
      hostRemove(el!)
    }

    performRemove()
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
