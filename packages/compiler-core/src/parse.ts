export interface ParserContext {
  source: string
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  console.log(context)

  return {}
}

function createParserContext(content: string): ParserContext {
  return {
    source: content
  }
}
