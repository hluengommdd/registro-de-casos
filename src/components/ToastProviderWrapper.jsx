import ToastProvider from './ToastProvider'

// Export wrapper as default component only to satisfy react-refresh
export default function ToastProviderWrapper({ children }) {
  return <ToastProvider>{children}</ToastProvider>
}
