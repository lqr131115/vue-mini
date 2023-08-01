import { CodegenResult } from './codegen'
import { baseParse } from './parse'

export function baseCompile(template: string, options = {}): CodegenResult {
  const ast = baseParse(template)

  return {
    ast
  }
}
