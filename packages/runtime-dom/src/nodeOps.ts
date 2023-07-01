const doc = document as Document

export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  createElement: tag => {
    const el = doc.createElement(tag)
    return el
  },
  createText: text => doc.createTextNode(text),
  createComment: text => doc.createComment(text),
  setElementText: (el: Element, text) => {
    el.textContent = text
  }
}
