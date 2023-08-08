import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE
}

export function createRoot(children, loc = {}) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc
  }
}

export function createVNodeCall(context, tag, props?, children?) {
  if (context) {
    // context.helper(getVNodeHelper(context.inSSR, false))
    context.helper(CREATE_ELEMENT_VNODE)
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children
  }
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children
  }
}

export function createConditionalExpression(
  test,
  consequent,
  alternate,
  newline = true
) {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
    newline,
    loc: {}
  }
}

export function createCallExpression(callee, args, loc = {}) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc,
    callee,
    arguments: args
  }
}

export function createObjectProperty(key: string, value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key,
    value
  }
}

export function createSimpleExpression(content, isStatic: boolean, loc = {}) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    content,
    isStatic
  }
}

export function createObjectExpression(properties, loc = {}) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc,
    properties
  }
}
