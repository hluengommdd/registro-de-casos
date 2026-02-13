import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Páginas en lazy loading para dividir chunks
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CasosActivos = lazy(() => import('./pages/CasosActivos'));
const CasosCerrados = lazy(() => import('./pages/CasosCerrados'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));
const SeguimientoWrapper = lazy(() => import('./pages/SeguimientoWrapper'));
const CierreCasoPage = lazy(() => import('./pages/CierreCasoPage'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const AlertasPlazos = lazy(() => import('./pages/AlertasPlazos'));

/**
 * Componente de loading con skeleton personalizado
 */
function PageLoader() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-slate-200 rounded-full w-16" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error fallback para rutas
 */
function RouteErrorFallback({ resetError = () => {} }: { resetError?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        Error al cargar la página
      </h2>
      <p className="text-slate-500 mb-6 max-w-md">
        Lo sentimos, ocurrió un problema al cargar esta sección. Por favor
        intenta de nuevo.
      </p>
      <button onClick={resetError} className="btn-primary px-6 py-2">
        Reintentar
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/casos-activos"
                element={
                  <ErrorBoundary>
                    <CasosActivos />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/casos-cerrados"
                element={
                  <ErrorBoundary>
                    <CasosCerrados />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/seguimientos"
                element={
                  <ErrorBoundary>
                    <SeguimientoWrapper />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/seguimientos/:caseId"
                element={
                  <ErrorBoundary>
                    <SeguimientoPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/cierre-caso/:caseId"
                element={
                  <ErrorBoundary>
                    <CierreCasoPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/estadisticas"
                element={
                  <ErrorBoundary>
                    <Estadisticas />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/alertas"
                element={
                  <ErrorBoundary>
                    <AlertasPlazos />
                  </ErrorBoundary>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
