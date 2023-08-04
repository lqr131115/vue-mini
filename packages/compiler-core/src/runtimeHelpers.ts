export const CREATE_VNODE = Symbol('createVNode')
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')

export const helperNameMap: any = {
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`
}
