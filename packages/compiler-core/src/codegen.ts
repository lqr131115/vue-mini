import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { helperNameMap } from './runtimeHelpers'
import { getVNodeHelper } from './utils'

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

export interface CodegenResult {
  code?: string
  preamble?: string
  ast?: any
  map?: any
}

export function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, indent, deindent, newline } = context

  genFunctionPreamble(context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) {`)
  indent()

  // push(`with (_ctx) {`)
  // indent()

  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = _Vue`)
    push(`\n`)
    newline()
  }

  push(`return `)

  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  deindent()
  push(`}`)

  return {
    ast,
    code: context.code
  }
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode!, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
  }
}

function genText(node, context) {
  context.push(JSON.stringify(node.content), node)
}

function genVNodeCall(node, context) {
  const { push, helper } = context
  const { tag, props, children, patchFlag, dynamicProps, isComponent } = node
  const callHelper = getVNodeHelper(context.inSSR, isComponent)
  push(helper(callHelper) + `(`, node)

  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])
  genNodeList(args, context)

  push(`)`)
}

function genNodeList(nodes: any[], context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      genNodeListAsArray(node, context)
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNodeListAsArray(nodes, context) {
  context.push('[')
  genNodeList(nodes, context)
  context.push(']')
}

function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--) {
    if (args[i] !== null) break
  }
  return args.slice(0, i + 1).map(arg => arg || `null`)
}

function genFunctionPreamble(context) {
  const { push, newline, runtimeGlobalName } = context
  const VueBinding = runtimeGlobalName
  push(`const _Vue = ${VueBinding}\n`)
  newline()
  push(`return `)
}

function createCodegenContext(ast) {
  const context = {
    code: '',
    inSSR: false,
    runtimeGlobalName: `Vue`,
    source: ast.loc.source,
    indentLevel: 0,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code, node?) {
      context.code += code
      if (node) {
        // TODO
      }
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent() {
      newline(--context.indentLevel)
    },
    newline() {
      newline(context.indentLevel)
    }
  }

  function newline(n: number) {
    context.push('\n' + `  `.repeat(n))
  }

  return context
}
