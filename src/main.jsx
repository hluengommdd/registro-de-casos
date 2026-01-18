import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProviderWrapper from './components/ToastProviderWrapper'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProviderWrapper>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ToastProviderWrapper>
  </StrictMode>,
)
