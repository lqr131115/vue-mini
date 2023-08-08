import {
  NodeTypes,
  createCallExpression,
  createConditionalExpression,
  createObjectProperty,
  createSimpleExpression
} from '../ast'
import { CREATE_COMMENT } from '../runtimeHelpers'
import {
  TransformContext,
  createStructuralDirectiveTransform
} from '../transform'
import { getMemoedVNodeCall, injectProp } from '../utils'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
        } else {
          // TODO
        }
      }
    })
  }
)

function createCodegenNodeForBranch(branch, keyIndex, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      createCallExpression(context.helper(CREATE_COMMENT), [`v-if`, `true`])
    )
  } else {
    return createChildrenCodegenNode(branch, keyIndex, context)
  }
}

function createChildrenCodegenNode(branch, keyIndex, context) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  )
  const { children } = branch
  const firstChild = children[0]
  const needFragmentWrapper =
    firstChild.length !== 1 || firstChild.type !== NodeTypes.ELEMENT
  if (needFragmentWrapper) {
    // TODO
  } else {
    const ret = firstChild
    const vnodeCall = getMemoedVNodeCall(ret)
    injectProp(vnodeCall, keyProperty)
    return ret
  }
}

function processIf(
  node,
  dir,
  context: TransformContext,
  processCodegen?: (
    node: any,
    branch: any,
    isRoot: boolean
  ) => (() => void) | undefined
) {
  if (dir.name === 'if') {
    const branch = createIfBranch(node, dir)
    const ifNode = {
      type: NodeTypes.IF,
      loc: {},
      branches: [branch]
    }
    context.replaceNode(ifNode)
    if (processCodegen) {
      processCodegen(ifNode, branch, true)
    }
  }
}

function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: {},
    children: [node],
    condition: dir.exp
  }
}
