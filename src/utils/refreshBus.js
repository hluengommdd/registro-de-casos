// Pequeño bus de eventos global para avisar recargas de datos
const bus = new EventTarget()

export function emitDataUpdated() {
  bus.dispatchEvent(new Event('data-updated'))
}

export function onDataUpdated(handler) {
  bus.addEventListener('data-updated', handler)
  return () => bus.removeEventListener('data-updated', handler)
}
