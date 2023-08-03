import { extend } from '@vue/shared'
import { CodegenResult } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'

export function baseCompile(template: string, options = {}): CodegenResult {
  const ast = baseParse(template)

  const [nodeTransforms] = getBaseTransformPreset()
  transform(
    ast,
    extend({}, options, {
      nodeTransforms: [...nodeTransforms]
    })
  )
  // generate
  return {
    ast
  }
}

export function getBaseTransformPreset() {
  return [[transformElement, transformText]]
}
