import type { ReactNode } from 'react';
import ToastProvider from './ToastProvider';

// Export wrapper as default component only to satisfy react-refresh
interface ToastProviderWrapperProps {
  children: ReactNode;
}

export default function ToastProviderWrapper({
  children,
}: ToastProviderWrapperProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
