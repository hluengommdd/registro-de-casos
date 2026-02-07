import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Páginas en lazy loading para dividir chunks
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CasosActivos = lazy(() => import('./pages/CasosActivos'));
const CasosCerrados = lazy(() => import('./pages/CasosCerrados'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));
const SeguimientoWrapper = lazy(() => import('./pages/SeguimientoWrapper'));
const CierreCasoPage = lazy(() => import('./pages/CierreCasoPage'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const AlertasPlazos = lazy(() => import('./pages/AlertasPlazos'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando…</div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/casos-activos" element={<CasosActivos />} />
            <Route path="/casos-cerrados" element={<CasosCerrados />} />
            <Route path="/seguimientos" element={<SeguimientoWrapper />} />
            <Route path="/seguimientos/:caseId" element={<SeguimientoPage />} />
            <Route path="/cierre-caso/:caseId" element={<CierreCasoPage />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/alertas" element={<AlertasPlazos />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

/* SeguimientoWrapper moved to src/pages/SeguimientoWrapper.jsx */
