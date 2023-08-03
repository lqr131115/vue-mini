import { ElementTypes, NodeTypes, createRoot } from './ast'

export interface ParserContext {
  source: string
}

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParserContext(content)

  const children = parseChildren(context, [])

  return createRoot(children)
}

function createParserContext(content: string): ParserContext {
  return {
    source: content
  }
}

function parseChildren(context: ParserContext, ancestors) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source
    if (startsWith(s, '{{')) {
      // TODO:
      node = null
    } else if (startsWith(s, '<')) {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    if (!node) {
      node = parseText(context)
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }

    // TODO: Whitespace handling strategy like v2
  }

  return nodes
}

function pushNode(nodes: any[], node) {
  nodes.push(node)
}

function parseText(context: ParserContext) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function parseElement(context: ParserContext, ancestors) {
  const element = parseTag(context, TagType.Start)!

  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()
  element.children = children

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  return element
}

function parseTag(context: ParserContext, type: TagType) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!
  const tag = match[1]

  advanceBy(context, match[0].length)

  let isSelfClosing = startsWith(context.source, '/>')

  advanceBy(context, isSelfClosing ? 2 : 1)

  if (type === TagType.End) {
    return
  }

  let tagType = ElementTypes.ELEMENT

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    isSelfClosing,
    props: [],
    children: []
  }
}

function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}

function isEnd(context: ParserContext, ancestors): boolean {
  const s = context.source

  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return !s
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  )
}

function startsWith(source: string, searchStr: string): boolean {
  return source.startsWith(searchStr)
}
