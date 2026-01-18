import { useContext } from 'react'
import ToastContext from '../components/toastContext'

export function useToast() {
  return useContext(ToastContext)
}
