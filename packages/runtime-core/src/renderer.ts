import { EMPTY_ARR, EMPTY_OBJ, ShapeFlags, isString } from '@vue/shared'
import {
  Text,
  Comment,
  Fragment,
  isSameVNodeType,
  normalizeVNode,
  VNode
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
      const el = (newVNode.el = oldVNode.el!)
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children as string)
      }
    }
  }

  const processCommentNode = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      hostInsert(
        (newVNode.el = hostCreateComment(newVNode.children as string) || ''),
        container,
        anchor
      )
    } else {
      newVNode.el = oldVNode.el!
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

        // 这里简单实现，bm只能是Function类型, vue3源码中也可以是支持Function[]. 其他生命周期hook同理
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
      mountChildren(vnode.children, el, anchor)
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
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          /**
           * new children is array
           * old children is array
           */
          patchKeyedChildren(oldChildren, newChildren, container, anchor)
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

  const patchKeyedChildren = (
    oldChildren,
    newChildren,
    container,
    parentAnchor
  ) => {
    let i = 0
    const newChildrenLength = newChildren.length
    let oldChildrenEnd = oldChildren.length - 1
    let newChildrenEnd = newChildrenLength - 1

    // 1. 自前向后
    // (a b) c
    // (a b) d e
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[i]
      const newVNode = normalizeVNode(newChildren[i])
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null)
      } else {
        break
      }
      i++
    }

    // 2. 自后向前
    // a (b c)
    // d e (b c)
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVNode = oldChildren[oldChildrenEnd]
      const newVNode = normalizeVNode(newChildren[newChildrenEnd])
      if (isSameVNodeType(oldVNode, newVNode)) {
        patch(oldVNode, newVNode, container, null)
      } else {
        break
      }
      oldChildrenEnd--
      newChildrenEnd--
    }

    // 新节点
    // (a b)
    // (a b) c
    // or
    // (a b)
    // c (a b)
    if (i > oldChildrenEnd) {
      if (i <= newChildrenEnd) {
        const nextPos = newChildrenEnd + 1
        const anchor =
          nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
        while (i <= newChildrenEnd) {
          patch(null, normalizeVNode(newChildren[i]), container, anchor)
          i++
        }
      }
    }
    // 旧节点
    // (a b) c
    // (a b)
    // or
    // c (a b)
    // (a b)
    else if (i > newChildrenEnd) {
      while (i <= oldChildrenEnd) {
        unmount(newChildren[i], true)
        i++
      }
    }
    // 乱序
    else {
      const oldStartIndex = i // prev starting index
      const newStartIndex = i // next starting index

      // 5.1 为newChildren创建 key: index 映射
      const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
      for (i = newStartIndex; i <= newChildrenEnd; i++) {
        const nextChild = normalizeVNode(newChildren[i])
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 循环遍历oldChildren 尝试修复匹配节点和删除不能存在的节点
      let j
      let patched = 0
      const toBePatched = newChildrenEnd - newStartIndex + 1
      let moved = false
      // used to track whether any node has moved
      let maxNewIndexSoFar = 0
      // works as Map<newIndex, oldIndex>
      // Note that oldIndex is offset by +1
      // and oldIndex = 0 is a special value indicating the new node has
      // no corresponding old node.
      // used for determining longest stable subsequence
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
        const prevChild = oldChildren[i]
        if (patched >= toBePatched) {
          // all new children have been patched so this can only be a removal
          unmount(prevChild, true)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // key-less node, try to locate a key-less node of the same type
          for (j = newStartIndex; j <= newChildrenEnd; j++) {
            if (
              newIndexToOldIndexMap[j - newStartIndex] === 0 &&
              isSameVNodeType(prevChild, newChildren[j])
            ) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          unmount(prevChild, true)
        } else {
          newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true  
          }
          patch(prevChild, newChildren[newIndex], container, null)
          patched++
        }
      }

      // 5.3 移动和挂载
      // generate longest stable subsequence only when nodes have moved
      // 仅当节点移动时生成最长稳定子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR
      j = increasingNewIndexSequence.length - 1
      // looping backwards so that we can use last patched node as anchor
      // 向后循环，以便我们可以使用最后修补的节点作为锚点
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = newStartIndex + i
        const nextChild = newChildren[nextIndex]
        const anchor =
          nextIndex + 1 < newChildrenLength
            ? newChildren[nextIndex + 1].el
            : parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          // mount new
          patch(null, nextChild, container, anchor)
        } else if (moved) {
          // move if:
          // There is no stable subsequence (e.g. a reverse)
          // OR current node is not among the stable sequence
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  const move = (vnode, container, anchor) => {
    const { el, type, children, shapeFlag } = vnode

    if (shapeFlag & ShapeFlags.COMPONENT) {
      move(vnode.component!.subTree, container, anchor)
      return
    }

    if (type === Fragment) {
      hostInsert(el!, container, anchor)
      for (let i = 0; i < (children as VNode[]).length; i++) {
        move((children as VNode[])[i], container, anchor)
      }
      hostInsert(vnode.anchor!, container, anchor)
      return
    }

    hostInsert(el!, container, anchor)
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
