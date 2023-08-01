import { compile } from '@vue/compiler-dom'

export { render } from '@vue/runtime-dom'
export {
  queuePreFlushCb,
  watch,
  h,
  Text,
  Comment,
  Fragment
} from '@vue/runtime-core'
export { reactive, effect, ref, computed } from '@vue/reactivity'

const compileCache = Object.create(null)

function compileToFunction(template: string, options?: any) {
  const key = template
  const cached = compileCache[key]
  if (cached) {
    return cached
  }

  const { code } = compile(template, options)

  const render = new Function(code!)()

  return (compileCache[key] = render)
}

export { compileToFunction as compile }
