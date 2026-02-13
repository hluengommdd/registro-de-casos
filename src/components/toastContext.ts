import { createContext } from 'react';
import type { ToastMessage } from './toastBus';

type ToastContextValue = {
  push: (toast: ToastMessage & { duration?: number }) => void;
};

const ToastContext = createContext<ToastContextValue>({
  push: () => {},
});

export default ToastContext;
