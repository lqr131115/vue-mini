import { NodeTypes, createCompoundExpression } from '../ast'
import { isText } from '../utils'

// Merge adjacent text nodes and expressions into a single expression   将相邻的文本节点和表达式显示为单个表达式
// e.g. <div>abc {{ d }} {{ e }}</div> should have a single expression node as child.
export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children

      let currentContainer: any = undefined

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc
                )

                currentContainer.children.push(` + `, child)
                children.splice(j, 1)
                j--
              }
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
