import { NodeTypes } from './ast'

export function isText(node): boolean {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}
