import {
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { BarChart } from 'recharts/es6/chart/BarChart'
import { Bar } from 'recharts/es6/cartesian/Bar'

import StatCard from '../components/StatCard'
import UrgentCaseCard from '../components/UrgentCaseCard'
import { getCases, getAllControlAlertas } from '../api/db'
import { formatDate } from '../utils/formatDate'
import { onDataUpdated } from '../utils/refreshBus'
import { useToast } from '../hooks/useToast'

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
]

const TIPOS_COLORS = {
  Leve: '#10b981', // green
  Grave: '#eab308', // yellow
  'Muy Grave': '#8b5cf6', // purple
  Gravísima: '#ef4444', // red
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[4, 5, 6].map(i => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  /* =========================
     DATA
  ========================== */

  const [casosActivos, setCasosActivos] = useState([])
  const [casosCerrados, setCasosCerrados] = useState([])
  const [alertasPlazo, setAlertasPlazo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    let mounted = true

    async function cargar() {
      try {
        setLoading(true)
        const [allCases, plazos] = await Promise.all([
          getCases(),
          getAllControlAlertas()
        ])

        if (!mounted) return

        const activos = allCases.filter(c => c.fields?.Estado !== 'Cerrado')
        const cerrados = allCases.filter(c => c.fields?.Estado === 'Cerrado')

        setCasosActivos(activos)
        setCasosCerrados(cerrados)
        // Filtrar alertas: no mostrar alertas vinculadas a casos cerrados
        const plazosFiltrados = (plazos || []).filter(a => {
          const casoId = a.fields?.CASOS_ACTIVOS?.[0]
          if (!casoId) return true
          const caso = allCases.find(c => c.id === casoId)
          return caso?.fields?.Estado !== 'Cerrado'
        })
        setAlertasPlazo(plazosFiltrados)
      } catch (e) {
        console.error(e)
        push({ type: 'error', title: 'Error al cargar dashboard', message: e?.message || 'Fallo de red' })
        if (mounted) setError(e?.message || 'Error al cargar datos')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    cargar()

    const off = onDataUpdated(() => {
      cargar()
    })

    return () => {
      mounted = false
      off()
    }
  }, [push])

  if (loading) return <DashboardSkeleton />
  if (error) return <p className="text-red-500">Error al cargar datos.</p>

  /* =========================
     MÉTRICAS CASOS
  ========================== */

  const totalActivos = casosActivos.length
  const totalCerrados = casosCerrados.length
  const totalCasos = totalActivos + totalCerrados

  const tasaCierre =
    totalCasos > 0 ? Math.round((totalCerrados / totalCasos) * 100) : 0

  const casosUrgentes = casosActivos.filter(c =>
    ['Muy Grave', 'Gravísima'].includes(c.fields?.Tipificacion_Conducta)
  )

  const hoyISO = new Date().toISOString().slice(0, 10)
  console.log('📅 Fecha de hoy:', hoyISO)

  const casosHoy = casosActivos.filter(c => {
    const fechaCreacion = c.fields?.Fecha_Creacion
    if (!fechaCreacion) return false

    // Extraer solo la parte de la fecha (YYYY-MM-DD) del timestamp
    const fechaSolo = fechaCreacion.split('T')[0]
    const esHoy = fechaSolo === hoyISO

    if (esHoy) {
      console.log('✅ Caso creado hoy:', c.fields?.Estudiante_Responsable, fechaCreacion)
    }
    return esHoy
  })

  console.log('📊 Total casos creados hoy:', casosHoy.length)

  /* =========================
     MÉTRICAS PLAZOS
  ========================== */

  const resumenPlazos = { rojos: 0, naranjos: 0, amarillos: 0 }

  alertasPlazo.forEach(a => {
    const txt = a.fields?.Alerta_Urgencia || ''
    if (txt.startsWith('🔴')) resumenPlazos.rojos++
    else if (txt.startsWith('🟠')) resumenPlazos.naranjos++
    else if (txt.startsWith('🟡')) resumenPlazos.amarillos++
  })

  // ✅ “Próximos a vencer ≤ 7 días” = naranjos + amarillos (según tu lógica actual)
  const proximosAVencer = resumenPlazos.naranjos + resumenPlazos.amarillos

    // Top alertas para listado (orden por días)
    const topAlertas = [...alertasPlazo]
      .sort((a, b) => {
        const da = a.fields?.Dias_Restantes
        const db = b.fields?.Dias_Restantes
        return (typeof da === 'number' ? da : Infinity) - (typeof db === 'number' ? db : Infinity)
      })
      .slice(0, 6)

  /* =========================
     GRÁFICOS (DATA)
  ========================== */

  // 1) Casos activos por tipificación (pie)
  const porTipo = {}
  casosActivos.forEach(c => {
    const t = c.fields?.Tipificacion_Conducta || 'Sin dato'
    porTipo[t] = (porTipo[t] || 0) + 1
  })
  const dataTipo = Object.entries(porTipo).map(([name, value]) => ({ name, value }))

  // 2) Plazos (pie)
  // Reorder and recolor: Próximos (verde), Urgentes (morado), Vencidos (rojo)
  const dataPlazos = [
    { name: 'Próximos', value: resumenPlazos.amarillos },
    { name: 'Urgentes', value: resumenPlazos.naranjos },
    { name: 'Vencidos', value: resumenPlazos.rojos },
  ]

  const PLAZOS_COLORS = {
    'Próximos': '#10b981', // green
    'Urgentes': '#8b5cf6', // purple
    'Vencidos': '#ef4444', // red
  }

  // 3) Casos por curso (bar) — solo activos
  const porCurso = {}
  casosActivos.forEach(c => {
    const curso = c.fields?.Curso_Incidente || 'Sin curso'
    porCurso[curso] = (porCurso[curso] || 0) + 1
  })

  // Ordenar cursos por cantidad desc y tomar top 10 para que no se haga eterno
  const dataCurso = Object.entries(porCurso)
    .map(([curso, total]) => ({ curso, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  /* =========================
     UI
  ========================== */

  return (
    <div className="container space-y-8">
      <p className="text-sm text-gray-600 font-medium">
        Resumen Operativo de Convivencia Escolar · Año lectivo 2026
      </p>

      {/* KPIs – FILA 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Atención Prioritaria"
          value={casosUrgentes.length}
          subtitle="Muy graves y gravísimos activos"
          icon={<AlertTriangle className="text-white" size={20} />}
          color="bg-red-600"
          onClick={() => navigate('/casos-activos?tip=Muy%20Grave')}
        />

        <StatCard
          title="Plazos Críticos"
          value={resumenPlazos.rojos}
          subtitle="Investigaciones vencidas"
          icon={<Timer className="text-white" size={20} />}
          color="bg-rose-700"
          onClick={() => navigate('/alertas?filter=vencidos')}
        />

        <StatCard
          title="Próximos a vencer"
          value={proximosAVencer}
          subtitle="≤ 7 días"
          icon={<Clock className="text-white" size={20} />}
          color="bg-orange-500"
          onClick={() => navigate('/alertas?filter=proximos')}
        />
      </div>

      {/* KPIs – FILA 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Casos en curso"
          value={totalActivos}
          subtitle="Investigación o seguimiento"
          icon={<Activity className="text-white" size={20} />}
          color="bg-amber-500"
          onClick={() => navigate('/casos-activos')}
        />

        <StatCard
          title="Tasa de cierre"
          value={`${tasaCierre}%`}
          subtitle={`${totalCerrados} de ${totalCasos} cerrados`}
          icon={<CheckCircle className="text-white" size={20} />}
          color="bg-green-600"
          onClick={() => navigate('/casos-cerrados')}
        />

        <StatCard
          title="Casos registrados hoy"
          value={casosHoy.length}
          subtitle="Incidentes del día"
          icon={<Clock className="text-white" size={20} />}
          color="bg-blue-600"
          onClick={() => navigate('/casos-activos?created=today')}
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Casos activos por tipificación</h3>
            <div className="flex items-center gap-2">
            </div>
          </div>

          {dataTipo.length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={dataTipo} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={80} 
                  label={(entry) => entry.name}
                  labelLine={false}
                >
                  {dataTipo.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={TIPOS_COLORS[entry.name] || COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} casos`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Estado de plazos (Control de Plazos)</h3>
            <div className="flex items-center gap-2">
            </div>
          </div>

          {dataPlazos.every(x => x.value === 0) ? (
            <p className="text-sm text-gray-500">No hay alertas para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={dataPlazos} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={80} 
                  label={false}
                >
                  {dataPlazos.map((entry, i) => (
                    <Cell key={i} fill={PLAZOS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Casos activos por curso (Top 10)</h3>
            <div className="flex items-center gap-2">
            </div>
          </div>

          {dataCurso.length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataCurso} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="curso" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* BLOQUES OPERATIVOS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* CASOS URGENTES */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              Casos que requieren atención inmediata
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => {}} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Ver todos</button>
            </div>
          </div>

          {casosUrgentes.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <ShieldCheck size={18} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Situación controlada</p>
                <p className="text-sm text-green-700">
                  No se registran casos que requieran atención inmediata.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {casosUrgentes.map(c => (
                <UrgentCaseCard
                  key={c.id}
                  title={c.fields?.Categoria_Conducta}
                  student={c.fields?.Estudiante_Responsable}
                  date={c.fields?.Fecha_Incidente}
                  level={c.fields?.Tipificacion_Conducta}
                />
              ))}
            </div>
          )}
        </div>

        {/* ALERTAS DE PLAZOS (clic → Seguimiento) */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Alertas de Plazos</h2>
            <div className="flex items-center gap-2">
            </div>
          </div>

          {topAlertas.length === 0 ? (
            <div className="p-4 rounded-lg bg-gray-50 border text-sm text-gray-600">
              No hay alertas activas.
              <div className="text-xs text-gray-400 mt-1">Revisión automática cada 24 horas</div>
            </div>
          ) : (
            <div className="space-y-3">
              {topAlertas.map(a => {
                const casoId = a.fields?.CASOS_ACTIVOS?.[0]
                const disabled = !casoId

                const alertaTxt = a.fields?.Alerta_Urgencia || ''
                const plazoKey = alertaTxt.startsWith('🔴')
                  ? 'Vencidos'
                  : alertaTxt.startsWith('🟠')
                  ? 'Urgentes'
                  : alertaTxt.startsWith('🟡')
                  ? 'Próximos'
                  : 'Próximos'

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (disabled) return
                      navigate(`/seguimientos?caso=${casoId}`)
                    }}
                    className={`border rounded-lg p-3 transition ${
                      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                    }`}
                    title={
                      disabled ? 'Esta alerta no tiene un caso vinculado' : 'Abrir seguimiento'
                    }
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-sm mt-1.5"
                          style={{ background: PLAZOS_COLORS[plazoKey] }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {a.fields?.Etapa_Debido_Proceso || 'Etapa sin dato'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            Responsable: {a.fields?.Responsable || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold">
                          {a.fields?.Alerta_Urgencia || '⏳'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {typeof a.fields?.Dias_Restantes === 'number'
                            ? `${a.fields.Dias_Restantes} días`
                            : '—'}
                          <div className="text-[11px] text-gray-400">
                            {a.fields?.Fecha_Plazo ? formatDate(a.fields.Fecha_Plazo) : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <button
                onClick={() => navigate('/alertas')}
                className="text-sm text-red-600 hover:underline"
              >
                Ver todas las alertas →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
