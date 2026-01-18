const listeners = new Set()

export function emitToast(toast) {
  listeners.forEach(fn => fn(toast))
}

export function subscribeToast(handler) {
  listeners.add(handler)
  return () => listeners.delete(handler)
}
