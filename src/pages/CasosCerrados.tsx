import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { getCaseFollowups, getCasesPage } from '../api/db';
import { getStudentName } from '../utils/studentName';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import useCachedAsync from '../hooks/useCachedAsync';
import { clearCache } from '../utils/queryCache';
import { onDataUpdated } from '../utils/refreshBus';
import InlineError from '../components/InlineError';
import usePersistedState from '../hooks/usePersistedState';

export default function CasosCerrados() {
  const [casos, setCasos] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalCasos, setTotalCasos] = useState(0);
  const [search, setSearch] = usePersistedState('casosCerrados.search', '');
  const [pageSize, setPageSize] = usePersistedState(
    'casosCerrados.pageSize',
    10,
  );
  const [page, setPage] = usePersistedState('casosCerrados.page', 1);
  const navigate = useNavigate();
  const { push } = useToast();

  const {
    data: closedCases,
    loading,
    error,
  } = useCachedAsync(
    `cases:cerrado:${page}:${pageSize}:${search || ''}`,
    () =>
      getCasesPage({
        status: 'Cerrado',
        search,
        page,
        pageSize,
      }),
    [refreshKey, page, pageSize, search],
    {
      ttlMs: 30000,
    },
  );

  useEffect(() => {
    if (!closedCases) return;
    setCasos(closedCases.rows || []);
    setTotalCasos(closedCases.total || 0);
  }, [closedCases]);

  useEffect(() => {
    if (!error) return;
    setCasos([]);
  }, [error]);

  useEffect(() => {
    const off = onDataUpdated(() => {
      clearCache(`cases:cerrado:${page}:${pageSize}:${search || ''}`);
      setRefreshKey((k) => k + 1);
    });
    return () => off();
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCasos / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCasos = useMemo(() => casos, [casos]);

  if (loading) {
    return <p className="text-gray-500">Cargando casos cerrados…</p>;
  }

  if (error) {
    return (
      <InlineError
        title="Error al cargar casos cerrados"
        message={error?.message || String(error)}
        onRetry={() => {
          clearCache('cases:cerrado');
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  async function handleExportPDF(caso) {
    try {
      const seguimientos = await getCaseFollowups(caso.id);
      const [{ pdf }, { default: InformeCasoDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/InformeCasoDocument'),
      ]);

      const blob = await pdf(
        <InformeCasoDocument caso={caso} seguimientos={seguimientos} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${caso.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Error al generar PDF:', e);
      push({
        type: 'error',
        title: 'PDF',
        message: e?.message || 'No se pudo generar el informe',
      });
    }
  }

  return (
    <div className="h-full p-2">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[1.375rem] font-semibold text-slate-900 tracking-tight truncate">
            Archivo Histórico
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {totalCasos} casos
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 px-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por estudiante, curso o conducta"
          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
        />
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>
        <button
          onClick={() => {
            setSearch('');
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-brand-50 hover:border-brand-200"
        >
          Limpiar
        </button>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col border border-slate-200 shadow-sm ring-1 ring-brand-100/50">
        {/* ENCABEZADO LISTA */}
        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/70 to-transparent backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
          <span>Listado Cerrados</span>
          <span>Fecha Cierre</span>
        </div>

        {/* LISTA SCROLLABLE */}
        <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {loading && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
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
            <div className="p-10 text-center text-slate-500 text-sm">
              No hay casos cerrados.
              <div className="mt-4">
                <button
                  onClick={() => navigate('/casos-activos')}
                  className="px-4 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-soft"
                >
                  Ir a casos activos
                </button>
              </div>
            </div>
          )}

          {!loading && totalCasos > 0 && casos.length === 0 && (
            <div className="p-10 text-center text-slate-500 text-sm">
              No hay resultados con esos filtros.
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-brand-50 hover:border-brand-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {!loading &&
            pagedCasos.map((caso) => {
              return (
                <div
                  key={caso.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm hover:shadow-soft hover:-translate-y-[1px]"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.conduct_type)}`}
                      >
                        {caso.conduct_type}
                      </span>
                      <span className="text-[10px] font-medium text-slate-600">
                        {formatDate(caso.incident_date)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {getStudentName(caso.students, 'Estudiante')}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {caso.conduct_category}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                          {caso.course_incident?.substring(0, 2) || 'NA'}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">
                          Cerrado
                        </span>
                      </div>

                      <button
                        onClick={() => navigate(`/cierre-caso/${caso.id}`)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 tap-target transition-colors"
                        title="Ver detalle"
                        aria-label="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleExportPDF(caso)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 tap-target transition-colors"
                        title="Imprimir informe"
                        aria-label="Imprimir informe"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {!loading && totalCasos > 0 && (
        <div className="flex items-center justify-between px-2 mt-4 text-sm text-slate-600">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
