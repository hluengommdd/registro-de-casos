import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart } from 'recharts/es6/chart/BarChart';
import { Bar } from 'recharts/es6/cartesian/Bar';
import {
  loadEstadisticas,
  getFechasFromAnioSemestre,
} from '../api/estadisticas';
import useConductCatalog from '../hooks/useConductCatalog';
import { onDataUpdated } from '../utils/refreshBus';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

const COLORS = ['#16a34a', '#ca8a04', '#7c3aed', '#dc2626'];

/* =========================
   COMPONENTE
========================== */

export default function Estadisticas() {
  const [anio, setAnio] = useState('');
  const [semestre, setSemestre] = useState('Todos');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { push } = useToast();

  useEffect(() => {
    let mounted = true;

    async function cargar() {
      try {
        setLoading(true);

        const { desde, hasta } = getFechasFromAnioSemestre(anio, semestre);

        if (!desde || !hasta) {
          if (mounted) setStats(null);
          return;
        }

        const data = await loadEstadisticas({ desde, hasta });
        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (e) {
        logger.error('Error cargando estadísticas:', e);
        if (mounted) setError(e.message);
        push({
          type: 'error',
          title: 'Error en estadísticas',
          message: e?.message || 'Fallo de red',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    cargar();

    const off = onDataUpdated(() => {
      cargar();
    });

    return () => {
      mounted = false;
      off();
    };
  }, [anio, semestre, push]);

  /* =========================
     DATOS PARA GRÁFICOS
  ========================== */

  const { conductTypes = [] } = useConductCatalog();

  const typeColorByKey = useMemo(() => {
    const m = {};
    for (const t of conductTypes || []) {
      if (t?.key && t?.color) m[t.key] = t.color;
    }
    return m;
  }, [conductTypes]);

  const tipoPalette = useMemo(
    () => (conductTypes || []).map((t) => t.color).filter(Boolean),
    [conductTypes],
  );

  const dataTipo = useMemo(() => {
    return (
      stats?.charts?.porTip?.map((item) => ({
        name: item.tipo ?? item.tipificacion ?? 'Sin tipificación',
        value: Number(item.total),
      })) ?? []
    );
  }, [stats]);

  const dataCursos = useMemo(() => {
    return (
      stats?.charts?.porCurso?.map((item) => ({
        curso: item.curso,
        total: Number(item.total),
      })) ?? []
    );
  }, [stats]);

  const dataMeses = useMemo(() => {
    return (
      stats?.charts?.porMes?.map((item) => ({
        mes: item.mes,
        total: Number(item.total),
      })) ?? []
    );
  }, [stats]);

  /* =========================
     AÑOS DISPONIBLES (2025, 2026, etc.)
  ========================== */

  const aniosDisponibles = useMemo(() => {
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    // Mostrar últimos 5 años y el actual
    return Array.from({ length: 6 }, (_, i) =>
      String(anioActual - i),
    ).reverse();
  }, []);

  // Seleccionar año por defecto
  useEffect(() => {
    if (!anio && aniosDisponibles.length) {
      setAnio(aniosDisponibles[aniosDisponibles.length - 1]);
    }
  }, [aniosDisponibles, anio]);

  /* =========================
     KPI OPERATIVOS (LOS QUE YA TENÍAS)
  ========================== */

  /* =========================
     KPI OPERATIVOS
  ========================== */

  const kpi = stats?.kpis ?? {
    casos_total: 0,
    abiertos: 0,
    cerrados: 0,
    promedio_cierre_dias: 0,
  };
  const plazos = stats?.plazos ?? {
    total_plazos: 0,
    fuera_plazo: 0,
    dentro_plazo: 0,
    cumplimiento_pct: 0,
  };
  const reincidencia = stats?.reincidencia ?? 0;
  const reincidentesList = stats?.reincidentes ?? [];
  const navigate = useNavigate();
  const mayorCarga = stats?.mayorCarga ?? {
    responsable: 'Sin responsable',
    total: 0,
  };
  const mayorNivel = stats?.mayorNivel ?? { level: 'Desconocido', total: 0 };
  const promedioSeguimientos = stats?.promedioSeguimientos ?? { promedio: 0 };
  const promedioDiasPrimerSeguimiento =
    stats?.promedioDiasPrimerSeguimiento ?? { promedio_dias: 0 };

  const cumplimientoPlazo = plazos.cumplimiento_pct;

  // Carga por responsable
  const cargaPorResponsable = mayorCarga.total > 0 ? [mayorCarga] : [];

  // Tiempo promedio por etapas - no disponible
  const tiempoPromedioEtapas = [];

  // Generar colores únicos por curso
  const coloresCursos = useMemo(() => {
    const cursos = dataCursos.map((d) => d.curso);
    const colores = {};

    const palette = tipoPalette.length ? tipoPalette : COLORS;

    cursos.forEach((curso, index) => {
      colores[curso] = palette[index % palette.length];
    });

    return colores;
  }, [dataCursos, tipoPalette]);

  /* =========================
     RENDER
  ========================== */

  if (loading) return <EstadisticasSkeleton />;
  if (error)
    return <p className="text-red-500">Error al cargar datos: {error}</p>;

  /* =========================
     EXPORT PDF
  ========================== */

  const handleExportPDF = async () => {
    try {
      const [{ pdf }, { default: EstadisticasDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/EstadisticasDocument'),
      ]);
      const { desde, hasta } = getFechasFromAnioSemestre(anio, semestre);

      const blob = await pdf(
        <EstadisticasDocument
          kpi={{
            total: kpi.casos_total || 0,
            abiertos: kpi.abiertos || 0,
            cerrados: kpi.cerrados || 0,
            promedio:
              kpi.promedio_cierre_dias != null
                ? Math.round(Number(kpi.promedio_cierre_dias))
                : null,
          }}
          cumplimientoPlazo={cumplimientoPlazo}
          fueraDePlazo={Array.from({ length: plazos.fuera_plazo || 0 })}
          seguimientosConPlazo={Array.from({
            length: plazos.total_plazos || 0,
          })}
          reincidencia={reincidentesList}
          cargaPorResponsable={cargaPorResponsable}
          tiempoPromedioEtapas={tiempoPromedioEtapas}
          dataTipo={dataTipo}
          dataCursos={dataCursos}
          filtros={{
            desde,
            hasta,
            semestre,
            curso: cursoSeleccionado || 'Todos',
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Estadisticas_${anio}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error al generar PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  return (
    <div className="container space-y-8 print-container pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Estadísticas de Convivencia Escolar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Análisis de datos, KPIs y tendencias
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="btn-primary bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm px-4 py-2 text-sm font-medium"
        >
          Exportar PDF
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
            Filtros
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Año
            </label>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            >
              <option value="">Todos</option>
              {aniosDisponibles.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Semestre
            </label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
              disabled={!anio}
            >
              <option value="Todos">Año completo</option>
              <option value="1">Primer semestre</option>
              <option value="2">Segundo semestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI OPERATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const promedioCierreDisplay =
            kpi.promedio_cierre_dias != null
              ? Math.round(Number(kpi.promedio_cierre_dias))
              : '—';

          const kpiItems = [
            { label: 'Casos Totales', value: kpi.casos_total, icon: '📊' },
            { label: 'Abiertos / En Proceso', value: kpi.abiertos, icon: '📂' },
            { label: 'Casos Cerrados', value: kpi.cerrados, icon: '✅' },
            {
              label: 'Promedio Cierre',
              value: promedioCierreDisplay,
              suffix: 'días',
              icon: '⏱',
            },
          ];

          const palette = [
            'bg-blue-500',
            'bg-amber-500',
            'bg-emerald-500',
            'bg-violet-500',
          ];

          return kpiItems.map((item, idx) => (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 transition-transform hover:scale-[1.02]"
            >
              <div
                className={`w-12 h-12 rounded-full ${palette[idx % palette.length]} bg-opacity-10 flex items-center justify-center text-xl shadow-sm border border-white`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">
                  {item.value}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    {item.suffix || ''}
                  </span>
                </p>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* KPI DIRECTIVOS */}
      <h2 className="text-xl font-bold text-slate-800 -mb-2">
        Indicadores de Gestión
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Cumplimiento de plazos
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${cumplimientoPlazo >= 90 ? 'text-emerald-600' : cumplimientoPlazo >= 70 ? 'text-amber-500' : 'text-red-500'}`}
            >
              {cumplimientoPlazo}%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {plazos.fuera_plazo} casos fuera de plazo / {plazos.total_plazos}{' '}
            total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Reincidencia
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-brand-600">
              {reincidencia}
            </span>
            <span className="text-sm font-medium text-slate-500">
              estudiantes
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Con 2 o más casos registrados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Mayor carga
          </p>
          <div className="mt-2 text-3xl font-extrabold text-slate-800">
            {mayorCarga.total ?? 0}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1 truncate">
            {mayorCarga.responsable ?? '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Nivel más conflictivo
          </p>
          <div className="mt-2 text-3xl font-extrabold text-slate-800">
            {mayorNivel.total ?? 0}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {mayorNivel.level ?? '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Promedio seguimientos
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {Number(promedioSeguimientos.promedio ?? 0).toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-500">
              acciones/caso
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Días primer seguimiento
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {Number(promedioDiasPrimerSeguimiento.promedio_dias ?? 0).toFixed(
                1,
              )}
            </span>
            <span className="text-sm font-medium text-slate-500">días</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Promedio desde incidente
          </p>
        </div>
      </div>

      {/* GRÁFICOS (LOS TUYOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REINCIDENTES — lista de estudiantes con >=2 casos */}
        {reincidentesList.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 col-span-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Estudiantes con Reincidencia
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Estudiante</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">
                      Cantidad de Casos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reincidentesList.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-brand-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() =>
                            navigate(
                              `/casos-activos?estudiante=${encodeURIComponent(r.estudiante)}`,
                            )
                          }
                          className="text-left font-semibold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-2"
                        >
                          <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold border border-brand-100">
                            {r.estudiante.charAt(0)}
                          </span>
                          {r.estudiante}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-red-100 text-red-800 font-bold text-xs border border-red-200">
                          {r.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">
            Evolución de Casos por Mes
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataMeses}>
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: '#334155', fontWeight: 600 }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1d4ed8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">
            Casos por Tipificación
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700 mb-4">
            {/* Legend generated from conductTypes */}
            {(conductTypes || []).map((t) => (
              <div
                key={t.key}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-100"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: t.color }}
                />
                <span>{t.label || t.key}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dataTipo}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={2}
                label={false}
              >
                {dataTipo.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      typeColorByKey[entry.name] ||
                      tipoPalette[i % tipoPalette.length] ||
                      COLORS[i % COLORS.length]
                    }
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: '#334155', fontWeight: 600 }}
                itemStyle={{ color: '#0f172a' }}
                formatter={(value, name) => [`${value} casos`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 col-span-2">
          <h3 className="font-bold text-slate-800 mb-4">
            Distribución por Curso
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dataCursos}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="curso"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: '#334155', fontWeight: 600 }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Bar
                dataKey="total"
                radius={[4, 4, 0, 0]}
                onClick={(d) => setCursoSeleccionado(d.curso)}
              >
                {dataCursos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={coloresCursos[entry.curso]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EstadisticasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="bg-white border text-slate-100 rounded-xl p-6 space-y-3">
        <div className="h-5 w-32 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 rounded-xl" />
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
