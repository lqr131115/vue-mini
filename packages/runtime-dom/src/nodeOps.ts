const doc = document as Document

export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
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
