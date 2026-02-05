import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
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
import useWindowSize from '../hooks/useWindowSize';

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
  const { width, height } = useWindowSize();

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
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(totalCasos / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  if (loading) {
    return <p className="text-gray-500">Cargando casos cerradosâ€¦</p>;
  }

  if (error) {
    return (
      <InlineError
        title="Error al cargar casos cerrados"
        message={error?.message || String(error)}
        onRetry={() => {
          clearCache(`cases:cerrado:${page}:${pageSize}:${search || ''}`);
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

  function Row({ index, style }) {
    const caso = casos[index];
    if (!caso) return null;

    return (
      <div style={style} className="px-2">
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-sm hover:shadow-md">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.fields.Tipificacion_Conducta)}`}
              >
                {caso.fields.Tipificacion_Conducta}
              </span>
              <span className="text-[10px] font-medium text-slate-600">
                {formatDate(caso.fields.Fecha_Incidente)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-slate-900 transition-colors">
                {getStudentName(
                  caso.fields.Estudiante_Responsable,
                  'Estudiante',
                )}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-1">
                {caso.fields.Categoria}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                  {caso.fields.Curso_Incidente?.substring(0, 2) || 'NA'}
                </div>
                <span className="text-[10px] text-slate-600 font-medium">
                  Cerrado
                </span>
              </div>

              <button
                onClick={() => navigate(`/cierre-caso/${caso.id}`)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 tap-target"
                title="Ver detalle"
                aria-label="Ver detalle"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => handleExportPDF(caso)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 tap-target"
                title="Imprimir informe"
                aria-label="Imprimir informe"
              >
                <FileText size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rowHeight = width && width < 640 ? 160 : 132;
  const listHeight = Math.min(
    640,
    Math.max(260, Math.floor((height || 800) * 0.55)),
  );

  return (
    <div className="h-full p-2">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
            Archivo HistÃ³rico
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
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
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
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col border border-slate-200 shadow-sm">
        {/* ENCABEZADO LISTA */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider">
          <span>Listado Cerrados</span>
          <span>Fecha Cierre</span>
        </div>

        {/* LISTA SCROLLABLE */}
        <div className="overflow-y-auto p-2 custom-scrollbar">
          {!loading && totalCasos === 0 && (
            <div className="p-10 text-center text-slate-500 text-sm">
              No hay casos cerrados.
              <div className="mt-4">
                <button
                  onClick={() => navigate('/casos-activos')}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900"
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
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Limpiar filtros
                </button>
              </div>
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

    </div>
  );
}
