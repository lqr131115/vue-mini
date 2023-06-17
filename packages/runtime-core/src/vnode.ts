import {
  ShapeFlags,
  isArray,
  isFunction,
  isObject,
  isString
} from '@vue/shared'
import {
  normalizeClass,
  normalizeStyle
} from 'packages/shared/src/normalizeProp'

export const Text = Symbol('Text')
export const Comment = Symbol('Comment')
export const Fragment = Symbol('Fragment')

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

export { createBaseVNode as createElementVNode }

export const createVNode = _createVNode as typeof _createVNode

function _createVNode(
  type: any,
  props: any = null,
  children: unknown = null
): VNode {
  // class & style normalization.
  if (props) {
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }

    if (isObject(style)) {
      props.style = normalizeStyle(style)
    }
  }

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0

  return createBaseVNode(type, props, children, shapeFlag)
}

function createBaseVNode(
  type: any,
  props: any = null,
  children: unknown = null,
  shapeFlag: number = ShapeFlags.ELEMENT ?? 0
) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag
  } as VNode

  normalizeChildren(vnode, children)

  return vnode
}

function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
  } else if (isFunction(children)) {
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children
  vnode.shapeFlag |= type
}
