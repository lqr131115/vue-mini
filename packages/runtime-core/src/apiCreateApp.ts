import { isFunction } from '@vue/shared'
import { createVNode } from './vnode'

let uid = 0
export function createAppAPI(render: Function) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = { ...rootComponent }
    }

    const app = {
      _uid: uid++,
      _component: null,
      _props: rootProps,
      _container: null,
      _context: null,
      _instance: null,

      mount(rootContainer) {
        app._container = rootContainer

        const vnode = createVNode(rootComponent, rootProps)

        render(vnode, rootContainer)
      }
    }

    return app
  }
}
