import { compile } from '@vue/compiler-dom'

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
