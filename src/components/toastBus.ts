export type ToastMessage = {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
};

const listeners = new Set<(toast: ToastMessage) => void>();

export function emitToast(toast: ToastMessage) {
  listeners.forEach((fn) => fn(toast));
}

export function subscribeToast(handler: (toast: ToastMessage) => void) {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
