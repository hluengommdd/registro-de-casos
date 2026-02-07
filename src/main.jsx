import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ConductCatalogProvider } from './context/ConductCatalogContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProviderWrapper from './components/ToastProviderWrapper';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProviderWrapper>
      <ErrorBoundary>
        <ConductCatalogProvider>
          <App />
        </ConductCatalogProvider>
      </ErrorBoundary>
    </ToastProviderWrapper>
  </StrictMode>,
);
