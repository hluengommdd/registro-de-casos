import { formatDate } from "../utils/formatDate"
import { tipHeaderClasses } from '../utils/tipColors'
import { listEvidenceByFollowup, getEvidenceSignedUrl } from "../api/evidence"

// =========================
// Helpers de temporalidad (robustos a timezone)
// =========================

// Trunca una fecha a medianoche local para evitar desfases por hora/zona
function toStartOfDay(d) {
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  x.setHours(0, 0, 0, 0)
  return x
}

// Diferencia en días enteros, robusta a timezone
function daysFrom(fromDate, toDate = new Date()) {
  if (!fromDate) return null
  const a = toStartOfDay(fromDate)
  const b = toStartOfDay(toDate)
  if (!a || !b) return null
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Texto humano consistente
function haceXDiasLabel(dias) {
  if (dias === null || dias === undefined) return null
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}

// Fuente de la actividad (auditoría/soporte)
function fuenteActividad({ lastAction, createdAt, seguimiento }) {
  if (lastAction) return 'acción'
  if (createdAt) return 'creación'
  if (seguimiento) return 'seguimiento'
  return null
}

function Chip({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-200 text-gray-700",
    green: "bg-emerald-200 text-emerald-800",
    purple: "bg-violet-200 text-violet-800",
    amber: "bg-amber-200 text-amber-900",
    rose: "bg-rose-200 text-rose-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[tone]}`}>
      {children}
    </span>
  );
}

export default function CaseDetailsCard({
  caso,
  seguimientos = [],
  involucradosSlot = null,
  isOverdue = false,
  overdueLabel = "Vencido",
  isReincidente = false,
  headerImageUrl = null,
  isPendingStart = false,
  actionsSlot = null,
  onEditAction = null,
}) {
  const f = caso?.fields || {};

  const nombre = f.Estudiante_Responsable || "Estudiante";
  const curso = f.Curso_Incidente || "—";
  const gravedad = f.Tipificacion_Conducta || "Muy Grave";
  const estado = f.Estado || "En Seguimiento";
  const desc = f.Descripcion || "Sin descripción";

  // =========================
  // Temporalidad secundaria (NO repetir SLA aquí)
  // =========================

  const lastAction = caso?._supabaseData?.last_action_date || null
  const createdAt = caso?._supabaseData?.created_at || f?.Fecha_Creacion || null
  const seguimiento = f?.Fecha_Seguimiento || null

  // prioridad: acción > creación > seguimiento
  const refActividad = lastAction || createdAt || seguimiento

  const actividadDias = daysFrom(refActividad)

  const actividadTxt =
    actividadDias === null
      ? null
      : (lastAction
        ? `Última acción ${haceXDiasLabel(actividadDias)}`
        : `Creado en sistema ${haceXDiasLabel(actividadDias)}`)

  const fuente = fuenteActividad({ lastAction, createdAt, seguimiento })

  const headerStyle = headerImageUrl
    ? { backgroundImage: `url(${headerImageUrl})` }
    : {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className={`relative h-28 ${headerImageUrl ? "bg-cover bg-center" : "bg-brand-800"
          }`}
        style={headerStyle}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 p-4 flex gap-4 items-center">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-md text-2xl">
            🙂
          </div>

          <div className="min-w-0 text-white pb-1">
            <div className="text-[10px] text-slate-100 uppercase tracking-widest font-semibold mb-0.5">Estudiante</div>
            <div className="font-bold text-lg leading-tight truncate">{nombre}</div>
            <div className="text-xs text-slate-200 truncate mt-0.5">Curso: {curso}</div>
          </div>
          {actionsSlot && (
            <div className="absolute top-3 right-4">
              {actionsSlot}
            </div>
          )}
        </div>

        {/* Badges container floating at bottom right */}
        <div className="absolute bottom-3 right-4 flex gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tipHeaderClasses(gravedad)} border border-white/10`}>{gravedad}</span>
          {!isPendingStart && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm border border-white/10">{estado}</span>}
          {isOverdue && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-sm">{overdueLabel}</span>}
        </div>
      </div>

      {/* Body scrolleable */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-3">
          {actividadTxt && (
            <div className="text-sm text-gray-600">
              {actividadTxt}
              {refActividad && (
                <span className="text-xs text-gray-400">
                  {" "}· {formatDate(refActividad)}
                  {fuente ? ` · (${fuente})` : ""}
                </span>
              )}
            </div>
          )}
          {isReincidente && (
            <div className="mt-2">
              <Chip tone="rose">Reincidente</Chip>
            </div>
          )}
        </div>

        <div className="px-4 pt-4">
          <div className="text-base font-extrabold text-gray-900">Descripción Breve</div>
          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{desc}</div>
        </div>

        <div className="px-4 py-4">
          <div className="text-base font-extrabold text-gray-900 mb-3">Involucrados</div>
          {involucradosSlot ? involucradosSlot : (
            <div className="text-sm text-gray-500">Sin involucrados.</div>
          )}
        </div>

        {/* Cronograma de Acciones */}
        {seguimientos && seguimientos.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-base font-extrabold text-gray-900 mb-3">
              Cronograma de Acciones ({seguimientos.length})
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {seguimientos.map((seg) => {
                const ff = seg?.fields || {}
                const createdAt = seg?._supabaseData?.created_at

                // Extraer hora de created_at
                const hora = createdAt ? new Date(createdAt).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '—'

                const handleVerEvidencias = async () => {
                  try {
                    const evidencias = await listEvidenceByFollowup(seg.id)
                    if (evidencias.length === 0) {
                      alert('No hay evidencias adjuntas para esta acción')
                      return
                    }

                    // Descargar cada archivo
                    for (const ev of evidencias) {
                      const url = await getEvidenceSignedUrl(ev.storage_path)
                      window.open(url, '_blank')
                    }
                  } catch (error) {
                    console.error('Error al obtener evidencias:', error)
                    alert('Error al cargar evidencias: ' + error.message)
                  }
                }

                return (
                  <div key={seg.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-gray-900">
                            {ff.Tipo_Accion || ff.Acciones || 'Acción'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ff.Etapa_Debido_Proceso || '—'}
                        </div>
                        {ff.Detalle && (
                          <div className="text-xs text-gray-700 mt-2">
                            {ff.Detalle}
                          </div>
                        )}
                        {ff.Observaciones && (
                          <div className="text-xs text-gray-600 mt-2 border-l-2 border-gray-200 pl-2">
                            Observaciones: {ff.Observaciones}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                          <span>📅 {formatDate(ff.Fecha)}</span>
                          <span>🕐 {hora}</span>
                          {ff.Responsable && ff.Responsable !== 'Por asignar' && (
                            <span>· 👤 {ff.Responsable}</span>
                          )}
                          {/* Link de evidencias */}
                          <span>·</span>
                          <button
                            onClick={handleVerEvidencias}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            📎 Ver evidencias
                          </button>
                          {/* Botón editar */}
                          {onEditAction && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => onEditAction(seg)}
                                className="text-gray-600 hover:text-gray-800 font-semibold hover:underline"
                              >
                                ✏️ Editar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                        {ff.Estado_Etapa || 'Completada'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {/* Footer acciones (removed - actions are rendered in header when provided) */}
    </div>
  )
}
