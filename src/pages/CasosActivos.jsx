import { useEffect, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { getCasesPage, getPlazosResumenMany, startSeguimiento } from '../api/db';
import { getStudentName } from '../utils/studentName';
import { emitDataUpdated, onDataUpdated } from '../utils/refreshBus';
import CaseDetailModal from '../components/CaseDetailModal';
import NuevoCasoModal from '../components/NuevoCasoModal';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { logger } from '../utils/logger';
import useCachedAsync from '../hooks/useCachedAsync';
import { clearCache } from '../utils/queryCache';
import { parseLocalDate } from '../utils/dateUtils';
import InlineError from '../components/InlineError';
import usePersistedState from '../hooks/usePersistedState';
import useWindowSize from '../hooks/useWindowSize';

export default function CasosActivos() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [loadingPlazos, setLoadingPlazos] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [plazos, setPlazos] = useState(new Map());
  const [totalCasos, setTotalCasos] = useState(0);
  const [search, setSearch] = usePersistedState('casosActivos.search', '');
  const [estadoFiltro, setEstadoFiltro] = usePersistedState(
    'casosActivos.estado',
    'Todos',
  );
  const [pageSize, setPageSize] = usePersistedState(
    'casosActivos.pageSize',
    10,
  );
  const [page, setPage] = usePersistedState('casosActivos.page', 1);
  const { width, height } = useWindowSize();

  const {
    data: casesPage,
    loading: loadingCases,
    error: errorCases,
  } = useCachedAsync(
    `cases:activos:${page}:${pageSize}:${estadoFiltro}:${search || ''}`,
    () =>
      getCasesPage({
        excludeStatus: 'Cerrado',
        status: estadoFiltro !== 'Todos' ? estadoFiltro : null,
        search,
        page,
        pageSize,
      }),
    [refreshKey, page, pageSize, estadoFiltro, search],
    {
      ttlMs: 30000,
    },
  );

  useEffect(() => {
    if (!casesPage) return;
    const activos = casesPage.rows || [];
    setTotalCasos(casesPage.total || 0);

    // Helpers
    async function loadAndSort() {
      setLoadingPlazos(true);
      let m = new Map();
      try {
        const ids = activos.map((c) => c.id);
        m = await getPlazosResumenMany(ids);
        setPlazos(m);
      } catch (plErr) {
        logger.warn('No se pudo cargar resumen de plazos:', plErr?.message);
        m = new Map();
        setPlazos(new Map());
      } finally {
        setLoadingPlazos(false);
      }

      // Orden sugerido: urgencia de plazos > estado del caso > antigÃ¼edad
      function plazoRank(caso) {
        const r = m.get(caso.id);
        const txt = (r?.alerta_urgencia || '').toUpperCase();
        if (!r) return 5;
        if (!txt) return 4; // Sin plazo
        if (txt.includes('VENCIDO')) return 0;
        if (txt.includes('VENCE HOY')) return 1;
        if (txt.includes('PRÃ“XIMO') || txt.includes('PROXIMO')) return 2;
        if (txt.includes('EN PLAZO') || txt.includes('AL DÃA') || txt.includes('AL DIA')) return 3;
        return 5;
      }

      function estadoRank(caso) {
        const e = caso.fields?.Estado || 'Reportado';
        if (e === 'Reportado') return 0;
        if (e === 'En Seguimiento') return 1;
        return 2;
      }

      activos.sort((a, b) => {
        const pr = plazoRank(a) - plazoRank(b);
        if (pr !== 0) return pr;
        const er = estadoRank(a) - estadoRank(b);
        if (er !== 0) return er;
        const da = parseLocalDate(a.fields?.Fecha_Incidente)?.getTime() || 0;
        const db = parseLocalDate(b.fields?.Fecha_Incidente)?.getTime() || 0;
        return da - db;
      });

      setCasos(activos);
    }

    loadAndSort();
  }, [casesPage]);

  useEffect(() => {
    if (!errorCases) return;
    logger.error(errorCases);
  }, [errorCases]);

  useEffect(() => {
    // âœ… Escuchar cambios de datos
    const off = onDataUpdated(() => {
      logger.debug('ðŸ”„ Refrescando casos activos...');
      clearCache(`cases:activos:${page}:${pageSize}:${estadoFiltro}:${search || ''}`);
      setRefreshKey((k) => k + 1);
    });

    return () => off();
  }, [page, pageSize, estadoFiltro, search]);

  const totalPages = Math.max(1, Math.ceil(totalCasos / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  function businessDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    // Normalize to midnight
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let days = 0;
    const step = start <= end ? 1 : -1;
    let current = new Date(start);

    while ((step > 0 && current < end) || (step < 0 && current > end)) {
      current.setDate(current.getDate() + step);
      const dow = current.getDay(); // 0=Sun..6=Sat
      if (dow !== 0 && dow !== 6) days += step;
    }

    return days;
  }

  function renderPlazoBadge(caso) {
    const r = plazos.get(caso.id) || null;
    const txt = (r?.alerta_urgencia || '').toUpperCase();
    const dias = r?.dias_restantes ?? null;

    if (!r || dias === null || txt.includes('SIN PLAZO')) {
      const deadline = caso?._supabaseData?.indagacion_due_date;
      const fallbackDays = businessDaysBetween(new Date(), deadline);

      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          {typeof fallbackDays === 'number'
            ? `${fallbackDays} DÃAS`
            : 'SIN PLAZO'}
        </span>
      );
    }

    if (!txt) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          SIN PLAZO
        </span>
      );
    }

    let label = txt;
    if (txt.includes('VENCE HOY')) label = 'VENCE HOY';
    else if (txt.includes('VENCIDO')) label = 'VENCIDO';
    else if (txt.includes('PRÃ“XIMO') || txt.includes('PROXIMO')) label = typeof dias === 'number' ? `${dias} DÃAS` : 'PRÃ“XIMO';
    else if (txt.includes('EN PLAZO') || txt.includes('AL DÃA') || txt.includes('AL DIA')) label = 'AL DÃA';

      const cls = txt.includes('VENCIDO')
        ? 'bg-red-100 text-red-800 border-red-200'
        : txt.includes('VENCE HOY')
          ? 'bg-red-100 text-red-800 border-red-200'
          : txt.includes('PRÃ“XIMO') || txt.includes('PROXIMO')
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cls}`}>
        {label}
      </span>
    );
  }

  function renderEstadoBadge(caso) {
    const e = caso.fields?.Estado || 'Reportado';
    const tone = e === 'Cerrado' ? 'slate' : e === 'En Seguimiento' ? 'green' : 'amber';
    const cls =
      tone === 'green'
        ? 'bg-green-100 text-green-800 border-green-200'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-800 border-slate-200';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{e}</span>
    );
  }

  function Row({ index, style }) {
    const caso = casos[index];
    if (!caso) return null;

    const estado = caso.fields?.Estado || 'Reportado';
    const initials = (getStudentName(caso.fields.Estudiante_Responsable, '') || 'NA')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

    return (
      <div style={style} className="px-2">
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-sm hover:shadow-md">
          <div className="flex items-center gap-4 p-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
              {initials}
            </div>

            {/* Main */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">
                      {getStudentName(caso.fields.Estudiante_Responsable, 'Estudiante')}
                    </h4>
                    <span className="text-[10px] text-slate-600 font-semibold truncate">
                      {caso.fields.Curso_Incidente || 'â€”'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {caso.fields.Descripcion || caso.fields.Categoria || 'â€”'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.fields.Tipificacion_Conducta)}`}
                  >
                    {caso.fields.Tipificacion_Conducta || 'â€”'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-600">
                    {formatDate(caso.fields.Fecha_Incidente)}
                  </span>
                  {renderEstadoBadge(caso)}
                  {renderPlazoBadge(caso)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCaso(caso)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 tap-target"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        if (estado === 'Reportado') {
                          await startSeguimiento(caso.id);
                          emitDataUpdated();
                        }
                        navigate(`/seguimientos/${caso.id}`);
                      } catch (e) {
                        alert(`No se pudo iniciar seguimiento: ${e?.message || e}`);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 ${
                      estado === 'Reportado'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {estado === 'Reportado' ? 'Iniciar seguimiento' : 'Seguimiento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rowHeight =
    width && width < 640 ? 190 : width && width < 1024 ? 170 : 156;
  const listHeight = Math.min(
    720,
    Math.max(260, Math.floor((height || 800) * 0.55)),
  );
  const loading = loadingCases || loadingPlazos;

  return (
    <div className="h-full p-2">
      {errorCases && (
        <div className="mb-4">
          <InlineError
            title="Error al cargar casos"
            message={errorCases?.message || String(errorCases)}
            onRetry={() => {
              clearCache(`cases:activos:${page}:${pageSize}:${estadoFiltro}:${search || ''}`);
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
            Listado de Casos Activos
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {totalCasos} casos
          </span>
        </div>

        <button
          onClick={() => setNuevo(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo Caso</span>
        </button>
      </div>

      {!loading && totalCasos > 0 && (
        <div className="flex items-center justify-between px-2 mt-4 text-sm text-slate-600">
          <span>
            PÃ¡gina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 px-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por estudiante, curso o conducta"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
        >
          <option value="Todos">Todos</option>
          <option value="Reportado">Reportado</option>
          <option value="En Seguimiento">En Seguimiento</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
        >
          <option value={10}>10 por pÃ¡gina</option>
          <option value={20}>20 por pÃ¡gina</option>
          <option value={50}>50 por pÃ¡gina</option>
        </select>
        <button
          onClick={() => {
            setSearch('');
            setEstadoFiltro('Todos');
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col border border-slate-200 shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
          <span>Expedientes</span>
          <span>Etapa</span>
        </div>

        <div className="overflow-y-auto p-2 custom-scrollbar">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalCasos === 0 && (
            <div className="p-10 text-center text-slate-500">
              <p>No hay casos activos.</p>
              <button
                onClick={() => setNuevo(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Crear nuevo caso
              </button>
            </div>
          )}

          {!loading && totalCasos > 0 && casos.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              <p>No hay resultados con esos filtros.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setEstadoFiltro('Todos');
                  setPage(1);
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {!loading && casos.length > 0 && (
            <List
              height={listHeight}
              itemCount={casos.length}
              itemSize={rowHeight}
              width="100%"
            >
              {Row}
            </List>
          )}
        </div>
      </div>

      {selectedCaso && (
        <CaseDetailModal
          caso={selectedCaso}
          onClose={() => setSelectedCaso(null)}
          setRefreshKey={setRefreshKey}
        />
      )}

      {nuevo && (
        <NuevoCasoModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
