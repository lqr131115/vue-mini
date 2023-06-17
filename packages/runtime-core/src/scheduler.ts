let isFlushPending = false

const pendingPreFlushCbs: Function[] = []
let activePreFlushCbs: Function[] | null = null

let currentFlushPromise: Promise<void> | null = null

const resolvedPromise = Promise.resolve() as Promise<any>

export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingPreFlushCbs)
}

export function queueCb(cb: Function, pendingQueue: Function[]) {
  pendingQueue.push(cb)
  queueFlush()
}

export function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

export function flushJobs() {
  isFlushPending = false
  flushPreFlushCbs()
}

export function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
    pendingPreFlushCbs.length = 0
    for (let i = 0; i < activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]()
    }
  }
}
