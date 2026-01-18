import { useEffect, useState } from 'react'
import { formatDate } from '../utils/formatDate'
import {
  deleteEvidence,
  getEvidenceSignedUrl,
  listEvidenceByFollowup,
} from '../api/evidence'
import { useToast } from '../hooks/useToast'

export default function SeguimientoItem({ seg, readOnly = false }) {
  const estadoColor = {
    Pendiente: 'bg-amber-100 text-amber-800',
    'En Proceso': 'bg-sky-100 text-sky-800',
    Completada: 'bg-teal-100 text-teal-800',
  }

  const TIPOS_COLORS = {
    'Leve': '#10b981', // emerald-500
    'Grave': '#f59e0b', // amber-500
    'Muy Grave': '#8b5cf6', // violet-500
    'Gravísima': '#ef4444', // red-500
  }

  const [evidencias, setEvidencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { push } = useToast()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await listEvidenceByFollowup(seg.id)
        if (!cancelled) setEvidencias(data)
      } catch (e) {
        if (!cancelled) {
          push({ type: 'error', title: 'Error al cargar evidencias', message: e?.message || 'Intenta de nuevo' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [seg.id, push])

  async function handleOpen(row) {
    try {
      const url = await getEvidenceSignedUrl(row.storage_path)
      window.open(url, '_blank')
    } catch (e) {
      push({ type: 'error', title: 'No se pudo abrir', message: e?.message || 'Intenta de nuevo' })
    }
  }

  async function handleDelete(row) {
    if (readOnly) return
    if (!confirm('¿Eliminar esta evidencia?')) return
    try {
      setDeletingId(row.id)
      await deleteEvidence(row)
      setEvidencias(prev => prev.filter(ev => ev.id !== row.id))
      push({ type: 'success', title: 'Evidencia eliminada', message: row.file_name })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo eliminar', message: e?.message || 'Intenta de nuevo' })
    } finally {
      setDeletingId(null)
    }
  }

  const tipo = seg.fields?.Tipificacion_Conducta
  const tipoColor = TIPOS_COLORS[tipo] || '#3b82f6'

  return (
    <div id={`seg-${seg.id}`} className="relative pl-6">
      {/* Línea vertical */}
      <div className="absolute left-2 top-0 h-full w-px" style={{ backgroundColor: tipoColor, opacity: 0.15 }} />

      {/* Punto */}
      <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: tipoColor }} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-brand-200 transition-colors">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold text-slate-900">
            {seg.fields?.Tipo_Accion}
          </p>

          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${estadoColor[seg.fields?.Estado_Etapa] || 'bg-slate-100 text-slate-600'
              }`}
          >
            {seg.fields?.Estado_Etapa || 'Completada'}
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1">
          <strong>Fecha:</strong> {formatDate(seg.fields?.Fecha)} · <strong>Responsable:</strong>{' '}
          {seg.fields?.Responsable || '—'}
        </p>

        {/* Plazo / Fecha_Plazo */}
        {(() => {
          const fechaPlazo = seg.fields?.Fecha_Plazo || null
          if (!fechaPlazo) return (
            <p className="text-xs text-slate-400 mt-2">Sin plazo definido</p>
          )

          const due = new Date(fechaPlazo + 'T00:00:00')
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const msDay = 24 * 60 * 60 * 1000
          const diff = Math.ceil((due - today) / msDay)

          let badgeText = ''
          let badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200'
          if (diff < 0) {
            badgeText = `Vencido ${Math.abs(diff)} día${Math.abs(diff) === 1 ? '' : 's'}`
            badgeClass = 'bg-red-50 text-red-700 border border-red-200'
          } else if (diff === 0) {
            badgeText = 'Vence hoy'
            badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200'
          } else {
            badgeText = `En ${diff} día${diff === 1 ? '' : 's'}`
            badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }

          return (
            <p className="text-xs text-slate-600 mt-2 flex items-center gap-2">
              <span className="font-semibold">Plazo:</span> {formatDate(fechaPlazo)}{' '}
              <span className={`px-2 py-0.5 rounded-full font-bold ${badgeClass}`}>
                {badgeText}
              </span>
            </p>
          )
        })()}

        {seg.fields?.Detalle && (
          <p className="text-sm text-gray-700 mt-2 break-words whitespace-pre-wrap">
            {seg.fields.Detalle}
          </p>
        )}

        {seg.fields?.Observaciones && (
          <p className="text-sm text-gray-600 mt-2 italic break-words whitespace-pre-wrap">
            {seg.fields.Observaciones}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Evidencias</p>
          {loading && <p className="text-xs text-gray-500">Cargando evidencias…</p>}
          {!loading && evidencias.length === 0 && (
            <p className="text-xs text-gray-500">Sin archivos adjuntos.</p>
          )}
          {!loading && evidencias.length > 0 && (
            <ul className="space-y-2">
              {evidencias.map(row => (
                <li
                  key={row.id}
                  className="flex items-center justify-between text-sm bg-white border rounded px-3 py-2 shadow-sm"
                >
                  <div className="truncate">
                    <p className="font-medium text-gray-800 truncate">{row.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {(row.file_size ? row.file_size / 1024 : 0).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(row)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Ver
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        className="text-red-600 text-xs hover:underline disabled:opacity-50"
                      >
                        {deletingId === row.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
