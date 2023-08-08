export const CREATE_VNODE = Symbol('createVNode')
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const CREATE_COMMENT = Symbol('createCommentVNode')

export const helperNameMap: any = {
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [CREATE_COMMENT]: `createCommentVNode`
}
