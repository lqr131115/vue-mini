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
      node = parseInterpolation(context)
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

function parseInterpolation(context: ParserContext) {
  const [open, close] = ['{{', '}}']
  advanceBy(context, open.length)
  const closeIndex = context.source.indexOf(close, open.length)
  const preTrimContent = parseTextData(context, closeIndex)
  const content = preTrimContent.trim()
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content
    }
  }
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
  advanceSpaces(context)

  let props = parseAttributes(context, type)

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
    props,
    children: []
  }
}

function parseAttributes(context: ParserContext, type: TagType) {
  const props: any[] = []
  const attributeName = new Set<string>()
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeName)

    // Trim whitespace between class
    if (
      attr.type === NodeTypes.ATTRIBUTE &&
      attr.value &&
      attr.name === 'class'
    ) {
      attr.value.content = attr.value.content.replace(/\s+/g, ' ').trim()
    }

    if (type === TagType.Start) {
      props.push(attr)
    }

    advanceSpaces(context)
  }
  return props
}

function parseAttribute(context: ParserContext, nameSet: Set<string>) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0]

  // if (nameSet.has(name)) {
  //   console.error('Duplicate attribute.')
  // }

  nameSet.add(name)

  advanceBy(context, name.length)

  let value: any = undefined

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }

  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!

    let dirName = match[1]

    // TODO
    let arg = undefined

    // TODO
    const modifiers = []

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: value.loc
      },
      arg,
      modifiers,
      loc: {}
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: {}
    },
    loc: {}
  }
}

function parseAttributeValue(context: ParserContext) {
  let content: string = ''
  const quote = context.source[0]
  const isQuoted = quote === `"` || quote === `'`
  if (isQuoted) {
    advanceBy(context, 1)
    const endIndex = context.source.indexOf(quote)
    if (endIndex === -1) {
      content = parseTextData(context, context.source.length)
    } else {
      content = parseTextData(context, endIndex)
      advanceBy(context, 1)
    }
  } else {
    // TODO: Unquoted
  }

  return {
    content,
    isQuoted,
    loc: {}
  }
}

function advanceSpaces(context: ParserContext) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
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
