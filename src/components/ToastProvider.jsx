import { useEffect, useRef, useState } from 'react'
import { emitToast, subscribeToast } from './toastBus'
import ToastContext from './toastContext'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    const handler = toast => {
      const id = ++idRef.current
      setToasts(prev => [...prev, { id, ...toast }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration || 4000)
    }

    const unsub = subscribeToast(handler)
    return () => unsub()
  }, [])

  useEffect(() => {
    const offline = () => emitToast({ type: 'error', title: 'Sin conexión', message: 'Revisa tu red' })
    const online = () => emitToast({ type: 'success', title: 'Conexión restaurada', message: 'Reconectado' })
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])

  const push = toast => emitToast(toast)

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`min-w-[240px] max-w-sm rounded-2xl shadow-xl px-4 py-3 text-sm text-white transition transform ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'success'
                  ? 'bg-green-600'
                  : 'bg-slate-800'
            }`}
          >
            {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
