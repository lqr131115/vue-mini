import { EMPTY_OBJ, ShapeFlags, isString } from '@vue/shared'
import {
  Text,
  Comment,
  Fragment,
  isSameVNodeType,
  normalizeVNode
} from './vnode'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { queuePreFlushCb } from './scheduler'
import { renderComponentRoot } from './componentRenderUtils'

export interface RendererOptions {
  insert(el: Element, parent: Element, anchor?: null): void
  remove(el: Element): void
  createText(text: string): any
  setText(el: Element, text: string): void
  createElement(type: string): Element
  setElementText(el: Element, text: string): void
  createComment(text: string): any
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
    setText: hostSetText,
    createText: hostCreateText,
    createComment: hostCreateComment,
    patchProp: hostPatchProp
  } = options

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountElement(newVNode, container, anchor)
    } else {
      patchElement(oldVNode, newVNode)
    }
  }

  const processText = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      hostInsert(
        (newVNode.el = hostCreateText(newVNode.children as string)),
        container,
        anchor
      )
    } else {
      const el = (oldVNode.el = newVNode.el!)
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children as string)
      }
    }
  }

  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      hostInsert(
        (newVNode.el = hostCreateComment(newVNode.children as string)),
        container,
        anchor
      )
    } else {
      oldVNode.el = newVNode.el!
    }
  }

  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container, anchor)
    } else {
      patchChildren(oldVNode, newVNode, container, anchor)
    }
  }

  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      mountComponent(newVNode, container, anchor)
    } else {
      updateComponent(oldVNode, newVNode)
    }
  }

  const mountComponent = (initialVNode, container, anchor) => {
    // vnode绑定component (instance)
    initialVNode.component = createComponentInstance(initialVNode)
    const instance = initialVNode.component

    // instance绑定render、data等
    setupComponent(instance)

    // 生成subTree 并 patch
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance

        // 这bm只能是Function类型, vue3中也支持Function[]. 其他生命周期hook同理
        if (bm) {
          bm()
        }
        const subTree = (instance.subTree = renderComponentRoot(instance))

        patch(null, subTree, container, anchor)

        if (m) {
          m()
        }

        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        let { next, vnode, bu, u } = instance
        if (!next) {
          next = vnode
        }

        if (bu) {
          bu()
        }

        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree

        patch(prevTree, nextTree, container, anchor)

        if (u) {
          u()
        }

        next.el = nextTree.el
      }
    }

    const update = (instance.update = () => effect.run())

    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queuePreFlushCb(update)
    )
    update()
  }
  const updateComponent = (oldVNode, newVNode) => {}
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

  const mountChildren = (children, container, anchor) => {
    if (isString(children)) {
      children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container, anchor)
    }
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
        if (shapeFlag & shapeFlag.ARRAY_CHILDREN) {
          /**
           * new children is array
           * old children is array
           */
        } else {
          /**
           * new children is null
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
      unmount(oldVNode, true)
      oldVNode = null
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
          processComponent(oldVNode, newVNode, container, anchor)
        } else {
          console.warn('Invalid VNode type:', type, `(${typeof type})`)
        }
        break
    }
  }

  const unmount = (vnode, doRemove = false) => {
    const { shapeFlag } = vnode

    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode.component!, doRemove)
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

  const unmountComponent = (instance, doRemove) => {
    const { update, subTree } = instance
    if (update) {
      unmount(subTree, doRemove)
    }
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, true)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}
