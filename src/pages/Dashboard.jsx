import {
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle,
  ShieldCheck,
  Timer,
  Plus,
  Download,
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
  Label,
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
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Panel de Control
        </h2>
        <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Monitoreo en tiempo real · Año lectivo 2026
        </p>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-min">

        {/* KPI 1: Casos Activos (Large) */}
        <div
          onClick={() => navigate('/casos-activos')}
          className="glass-panel p-5 col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-brand-600 to-brand-800 text-white relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-brand-100">
              <Activity size={18} />
              <span className="font-semibold text-[13px] uppercase tracking-wider">Casos Activos</span>
            </div>
            <div className="text-4xl font-black mb-1.5 tracking-tight">
              {totalActivos}
            </div>
            <div className="text-[13px] text-brand-100 font-medium">
              En investigación o seguimiento
            </div>
          </div>
        </div>

        {/* KPI 2: Atención Prioritaria */}
        <div
          onClick={() => navigate('/casos-activos?tip=Muy%20Grave')}
          className="glass-panel p-5 bg-white relative group cursor-pointer hover:border-red-200 transition-all hover:shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Prioridad Alta</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{casosUrgentes.length}</h3>
            </div>
            <div className="p-2 rounded-xl bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg w-fit">
            Muy graves / Gravísimos
          </div>
        </div>

        {/* KPI 3: Tasa de Cierre */}
        <div
          onClick={() => navigate('/casos-cerrados')}
          className="glass-panel p-5 bg-white relative group cursor-pointer hover:border-emerald-200 transition-all hover:shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Tasa Cierre</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{tasaCierre}%</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${tasaCierre}%` }} />
          </div>
        </div>

        {/* KPI 4: Alertas */}
        <div
          onClick={() => navigate('/alertas?filter=vencidos')}
          className="glass-panel p-6 relative group cursor-pointer bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden hover:scale-[1.02] transition-all"
        >
          <div className="absolute -bottom-4 -right-4 text-white/10 rotate-12">
            <Timer size={100} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-center">
              <span className="text-white/80 font-bold text-sm uppercase">Vencidos</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">Crítico</span>
            </div>
            <div>
              <span className="text-3xl font-black">{resumenPlazos.rojos}</span>
              <span className="text-[13px] text-white/80 ml-2">casos</span>
            </div>
          </div>
        </div>

        {/* CHART 1: Tipificación (Wide) */}
        <div className="glass-panel p-5 col-span-1 md:col-span-2 lg:col-span-2 row-span-2 flex flex-col">
          <h3 className="font-bold text-slate-800 text-base mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
            Distribución por Tipificación
          </h3>
          <div className="flex-1 min-h-[260px] sm:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {dataTipo.map((entry, i) => (
                    <linearGradient id={`gradient-${i}`} key={i} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TIPOS_COLORS[entry.name] || COLORS[i % COLORS.length]} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={TIPOS_COLORS[entry.name] || COLORS[i % COLORS.length]} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={dataTipo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={70}
                  paddingAngle={6}
                  stroke="none"
                >
                  {dataTipo.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={TIPOS_COLORS[entry.name] || COLORS[i % COLORS.length]}
                      style={{ filter: 'drop-shadow(0px 6px 12px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                  <Label
                    value={totalActivos}
                    position="center"
                    fill="#1e293b"
                    style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Inter' }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LISTA: Casos Urgentes (Tall) */}
        <div className="glass-panel p-0 col-span-1 md:col-span-1 lg:col-span-2 row-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-red-100 p-1.5 rounded-lg text-red-600"><ShieldCheck size={18} /></span>
              Casos Críticos
            </h3>
            <button onClick={() => navigate('/casos-activos?tip=Muy%20Grave')} className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Ver Todo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
            {casosUrgentes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <ShieldCheck size={48} className="mb-3 text-emerald-300 opacity-50" />
                <p className="font-medium text-slate-500">Todo bajo control</p>
                <p className="text-sm">No hay casos críticos activos.</p>
              </div>
            ) : (
              casosUrgentes.map(c => (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/seguimientos?caso=${c.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide border border-red-100">
                      {c.fields?.Tipificacion_Conducta}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDate(c.fields?.Fecha_Incidente)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-brand-600 transition-colors">
                    {c.fields?.Categoria || 'Sin categoría'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    {c.fields?.Estudiante_Responsable || 'Sin Estudiante'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHART 2: Plazos (Small) */}
        <div className="glass-panel p-5 col-span-1 md:col-span-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Estado de Plazos</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPlazos} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {dataPlazos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLAZOS_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {dataPlazos.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAZOS_COLORS[d.name] }}></div>
                  <span className="font-medium text-slate-600">{d.name}</span>
                </div>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 3: Cursos (Wide Bottom) */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3">
          <h3 className="font-bold text-slate-800 mb-6">Top 10 Cursos con más incidentes</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCurso}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="curso" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" fill="url(#gradient-bar)" radius={[6, 6, 0, 0]} barSize={40}>
                  <defs>
                    <linearGradient id="gradient-bar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
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
