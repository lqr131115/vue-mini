import { isString } from '@vue/shared'
import { NodeTypes } from './ast'

export interface TransformContext {
  root: object
  parent: ParentNode | null
  childIndex: number
  currentNode: any
  nodeTransforms: any[]
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T)
}

//  1. 深度优先排序  孙 -> 子 -> 父
//  2. 完成具体的节点转化 transformElement、transformText等
export function transform(root, options) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
}

export function createTransformContext(root, { nodeTransforms = [] }) {
  const context: TransformContext = {
    root,
    nodeTransforms,
    parent: null,
    childIndex: 0,
    currentNode: root,
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }
  return context
}

export function traverseNode(node, context: TransformContext) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
    if (!context.currentNode) {
      // node was removed
      return
    } else {
      // node may have been replaced
      node = context.currentNode
    }
  }
  switch (node.type) {
    case NodeTypes.COMMENT:
      // TODO
      break
    case NodeTypes.IF_BRANCH:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  context.currentNode = node

  // 深度优先 从后往前?
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

export function traverseChildren(parent, context: TransformContext) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i]
    if (isString(child)) continue
    context.parent = parent
    context.childIndex = i
    traverseNode(child, context)
  }
}
