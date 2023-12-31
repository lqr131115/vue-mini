import { extend } from '@vue/shared'
import { CodegenResult, generate } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'
import { transformIf } from './transforms/vif'

export function baseCompile(template: string, options = {}): CodegenResult {
  const ast = baseParse(template)

  const [nodeTransforms] = getBaseTransformPreset()
  transform(
    ast,
    extend({}, options, {
      nodeTransforms: [...nodeTransforms]
    })
  )

  return generate(ast)
}

export function getBaseTransformPreset() {
  return [[transformElement, transformText, transformIf]]
}
