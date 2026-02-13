import { Edit2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateCase, iniciarDebidoProceso, getCase } from '../api/db';
import { logger } from '../utils/logger';
import { useState } from 'react';
import InvolucradosListPlaceholder from './InvolucradosListPlaceholder';
import CaseStudentHeaderCard from './CaseStudentHeaderCard';
import { getStudentName } from '../utils/studentName';
import { emitDataUpdated } from '../utils/refreshBus';
import { getCaseStatusLabel } from '../utils/caseStatus';

type CaseLike = {
  id: string;
  students?: unknown;
  short_description?: string | null;
  conduct_category?: string | null;
  conduct_type?: string | null;
  created_at?: string | null;
  course_incident?: string | null;
  incident_date?: string | null;
  incident_time?: string | null;
  seguimiento_started_at?: string | null;
};

export default function CaseDetailPanel({
  caso,
  setRefreshKey,
  onDataChange,
  readOnly = false,
  hideStartButton = false,
}: {
  caso: CaseLike;
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>;
  onDataChange?: () => void;
  readOnly?: boolean;
  hideStartButton?: boolean;
}) {
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [descripcion, setDescripcion] = useState(caso.short_description || '');
  const [guardando, setGuardando] = useState(false);

  // ✅ En Casos Activos NO mostramos SLA
  // La falta es el texto de la conducta
  const falta = caso.conduct_category || caso.conduct_type || '';

  // Calcular días desde creación para información contextual
  const diasDesdeCreacion = caso.created_at
    ? Math.floor(
        (Date.now() - new Date(caso.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  async function handleIniciarDebidoProceso(
    e?: React.MouseEvent<HTMLButtonElement>,
  ) {
    e?.stopPropagation();
    try {
      logger.debug('🚀 Iniciando debido proceso para caso:', caso.id);
      logger.debug('Estado actual:', getCaseStatusLabel(caso));

      // ✅ Ejecutar RPC
      await iniciarDebidoProceso(caso.id, 10);
      logger.debug('✅ RPC start_due_process ejecutado correctamente');

      // ✅ Emitir evento para refrescar listados GLOBALMENTE
      logger.debug('🔔 Emitiendo evento de actualización global');
      emitDataUpdated();

      // ✅ Forzar refresh reactivo
      setRefreshKey?.((k) => k + 1);
      onDataChange?.();

      // ⏳ IMPORTANTE: Delay para que Supabase procese el cambio
      logger.debug('⏳ Esperando 3 segundos para que Supabase actualice...');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // ✅ Refrescar el caso SIN caché
      logger.debug('🔄 Refrescando caso desde Supabase SIN caché...');
      try {
        const casoActualizado = await getCase(caso.id);
        if (casoActualizado) {
          logger.debug('✅ Caso refrescado:');
          logger.debug(
            '   - Estado nuevo:',
            getCaseStatusLabel(casoActualizado),
          );
          logger.debug('   - ID:', casoActualizado.id);
        }
      } catch (refreshErr) {
        const msg =
          refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
        logger.warn('⚠️ Warning al refrescar (pero continuamos):', msg);
      }

      // ✅ Navegar a Seguimientos
      logger.debug('📍 Navegando a /seguimientos/' + caso.id);
      navigate(`/seguimientos/${caso.id}`);
    } catch (err) {
      logger.error('❌ Error crítico en handleIniciarDebidoProceso:', err);
      const errorMsg =
        err instanceof Error ? err.message : 'Error iniciando debido proceso';
      alert(`Error: ${errorMsg}`);
    }
  }

  async function verSeguimiento() {
    // NO debe iniciar nada, solo navega
    navigate(`/seguimientos/${caso.id}`);
  }

  async function guardarDescripcion() {
    try {
      setGuardando(true);
      await updateCase(caso.id, { short_description: descripcion });
      caso.short_description = descripcion;
      setEditando(false);
      alert('Descripción actualizada correctamente');
    } catch (e) {
      logger.error(e);
      alert('Error al guardar la descripción');
    } finally {
      setGuardando(false);
    }
  }

  function cancelarEdicion() {
    setDescripcion(caso.short_description || '');
    setEditando(false);
  }

  return (
    <div className="h-full flex flex-col bg-white/30 backdrop-blur-sm">
      {/* HEADER: No se muestra en Casos Activos */}
      <div className="hidden"></div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Tarjeta estudiante (sin SLA en Casos Activos) */}
        {(() => {
          const studentName = getStudentName(caso.students, '—');
          return (
            <CaseStudentHeaderCard
              studentName={studentName}
              course={caso.course_incident || '—'}
              tipificacion={caso.conduct_type || '—'}
              estado={getCaseStatusLabel(caso, '—')}
              falta={falta}
              // En Casos Activos no se muestra SLA
              isOverdue={false}
              overdueLabel={null}
              isPendingStart={!caso.seguimiento_started_at}
            />
          );
        })()}

        {/* Descripción */}
        <div className="glass-card p-4 bg-white/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Descripción breve
            </h3>
            {!readOnly && !editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-1 rounded-md"
              >
                <Edit2 size={12} />
                Editar
              </button>
            )}
          </div>

          {readOnly ? (
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {caso.short_description || 'Sin descripción'}
            </p>
          ) : editando ? (
            <div className="space-y-2">
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white/80"
                placeholder="Escribe la descripción del caso..."
              />
              <div className="flex gap-2">
                <button
                  onClick={guardarDescripcion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-xs font-bold"
                >
                  <Save size={12} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-brand-50 text-xs font-medium"
                >
                  <X size={12} />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {caso.short_description || 'Sin descripción'}
            </p>
          )}
        </div>

        {/* Fecha/Hora */}
        <div className="text-sm text-gray-600">
          <span>{caso.incident_date}</span>
          <span className="mx-2">·</span>
          <span>{caso.incident_time}</span>
          {diasDesdeCreacion !== null && (
            <>
              <span className="mx-2">·</span>
              <span className="text-gray-500">
                Creado hace {diasDesdeCreacion}{' '}
                {diasDesdeCreacion === 1 ? 'día' : 'días'}
              </span>
            </>
          )}
        </div>

        {/* Involucrados */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Involucrados
          </h3>
          <InvolucradosListPlaceholder casoId={caso.id} />
        </div>
      </div>

      {/* BOTÓN abajo */}
      {!hideStartButton && (
        <div className="p-4 sm:p-6 border-t bg-transparent">
          {caso.seguimiento_started_at ? (
            <button
              onClick={verSeguimiento}
              className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold w-full hover:bg-brand-700 transition"
            >
              Ver seguimiento
            </button>
          ) : (
            <button
              onClick={handleIniciarDebidoProceso}
              disabled={readOnly}
              className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold w-full hover:bg-green-700 transition disabled:opacity-60"
            >
              Iniciar debido proceso
            </button>
          )}
        </div>
      )}
    </div>
  );
}
