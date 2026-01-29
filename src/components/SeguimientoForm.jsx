import { useEffect, useRef, useState } from 'react';
import { createFollowup, updateFollowup, getStageSlaRows } from '../api/db';
import { uploadEvidenceFiles } from '../api/evidence';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

const RESPONSABLES = [
  'Inspector/a',
  'Director/a Ciclo Secundario',
  'Director/a Ciclo Primaria',
  'Coordinador/a Ciclo Secundario',
  'Coordinador/a Ciclo Primaria',
  'Psicologo/a',
  'Encargado/a Convivencia Escolar',
];

const ACTION_TO_STAGE = {
  'Recepción de denuncia / reporte': '1. Notificación Estudiante/s',
  'Notificación a estudiante': '1. Notificación Estudiante/s',
  'Notificación a apoderados': '2. Notificación Apoderados',

  'Recopilación de antecedentes': '3. Recopilación Antecedentes',

  'Entrevista a estudiante': '4. Entrevistas',
  'Entrevista a apoderados': '4. Entrevistas',
  'Entrevista a testigos': '4. Entrevistas',

  'Solicitud/recepción de descargos': '5. Indagación',
  'Medida cautelar / resguardo': '5. Indagación',
  'Medida formativa / reparatoria': '5. Indagación',
  'Medida disciplinaria': '5. Indagación',

  'Resolución fundada': '6. Resolución',
  'Notificación de resolución': '6. Resolución',

  'Apelación / recurso': '7. Apelación',

  'Seguimiento': '8. Seguimiento',
};

export default function SeguimientoForm({
  casoId,
  defaultProcessStage = null,
  followup = null,
  onSaved,
}) {
  const isEdit = Boolean(followup?.id);
  const [tipoAccion, setTipoAccion] = useState('');
  const [etapa, setEtapa] = useState(defaultProcessStage || '');
  const [responsable, setResponsable] = useState('');
  const [detalle, setDetalle] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [files, setFiles] = useState([]);
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [stageOptions, setStageOptions] = useState([]);
  const [validStageSet, setValidStageSet] = useState(new Set());
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stagesError, setStagesError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { push } = useToast();

  // Pre-cargar datos cuando se edita
  useEffect(() => {
    if (!followup) return;
    const ff = followup.fields || {};
    setTipoAccion(ff.Tipo_Accion || ff.Acciones || '');
    setEtapa(ff.Etapa_Debido_Proceso || defaultProcessStage || '');
    setResponsable(ff.Responsable || '');
    setDetalle(ff.Detalle || ff.Descripcion || '');
    setObservaciones(ff.Observaciones || '');
    setFecha(
      ff.Fecha || ff.Fecha_Seguimiento || new Date().toISOString().slice(0, 10),
    );
  }, [followup, defaultProcessStage]);

  // Cargar etapas oficiales desde Supabase (stage_sla)
  useEffect(() => {
    let mounted = true;
    async function loadStages() {
      setStagesLoading(true);
      setStagesError(null);
      try {
        const rows = await getStageSlaRows();
        const keys = (rows || []).map((r) => r.stage_key).filter(Boolean);
        // Si estamos en edición y la etapa histórica existe, preservarla (mostrarla)
        const historical = followup?.fields?.Etapa_Debido_Proceso;
        const finalKeys = historical && !keys.includes(historical)
          ? [historical, ...keys]
          : keys;
        if (!mounted) return;
        setStageOptions(finalKeys);
        setValidStageSet(new Set(keys));
      } catch (e) {
        logger.error('Error cargando stage_sla rows', e);
        if (!mounted) return;
        setStageOptions([]);
        setValidStageSet(new Set());
        setStagesError(e?.message || 'Error cargando etapas');
      } finally {
        if (mounted) setStagesLoading(false);
      }
    }
    loadStages();
    return () => { mounted = false; };
  }, [followup]);

  // Reset al salir de edición
  useEffect(() => {
    if (followup) return;
    setTipoAccion('');
    setEtapa(defaultProcessStage || '');
    setResponsable('');
    setDetalle('');
    setObservaciones('');
    setFiles([]);
    setFecha(new Date().toISOString().slice(0, 10));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [followup, defaultProcessStage]);

  // Si cambia la etapa por defecto y no estamos editando, actualizar el select
  useEffect(() => {
    if (!isEdit && defaultProcessStage) {
      setEtapa(defaultProcessStage);
    }
  }, [defaultProcessStage, isEdit]);

  // Cuando cambian las opciones válidas y no estamos editando, aplicar autofill sugerido
  useEffect(() => {
    if (!isEdit && !etapa && tipoAccion) {
      const suggested = ACTION_TO_STAGE[tipoAccion];
      if (suggested && validStageSet.has(suggested)) {
        setEtapa(suggested);
      }
    }
  }, [validStageSet, tipoAccion, isEdit, etapa]);

  async function handleSubmit(e) {
    e.preventDefault();
    // normalizar etapa antes de validar/enviar
    const etapaClean = (etapa || '').trim().replace(/\s+/g, ' ');

    if (!tipoAccion || !etapaClean) {
      push({
        type: 'error',
        title: 'Datos incompletos',
        message: 'Selecciona tipo de acción y etapa',
      });
      return;
    }

    // Validación dura: si conocemos las etapas oficiales, exigir una de ellas
    if (validStageSet && validStageSet.size > 0 && !validStageSet.has(etapaClean)) {
      push({
        type: 'error',
        title: 'Etapa inválida',
        message: `La fase "${etapaClean}" no es válida. Selecciona una fase oficial (stage_sla).`,
      });
      return;
    }

    try {
      setLoading(true);

      // 📅 Fecha base (registro/edición)
      const fechaISO = fecha || new Date().toISOString().slice(0, 10);

      // Loguear payload UI (etapa raw vs clean)
      logger.debug('🧾 Followup submit payload (UI):', {
        casoId,
        tipoAccion,
        etapaRaw: etapa,
        etapaClean,
        responsable,
        fechaISO,
      });

      let savedFollowup = null;

      if (isEdit) {
        savedFollowup = await updateFollowup(followup.id, {
          Caso_ID: casoId,
          Fecha_Seguimiento: fechaISO,
          Tipo_Accion: tipoAccion,
          Etapa_Debido_Proceso: etapaClean,
          Descripcion: detalle || tipoAccion,
          Acciones: responsable || 'Por asignar',
          Responsable: responsable || 'Por asignar',
          Detalle: detalle,
          Observaciones: observaciones,
        });
      } else {
        savedFollowup = await createFollowup({
          Caso_ID: casoId,
          Fecha_Seguimiento: fechaISO,
          Tipo_Accion: tipoAccion,
          Etapa_Debido_Proceso: etapaClean,
          Descripcion: detalle || tipoAccion,
          Acciones: responsable || 'Por asignar',
          Responsable: responsable || 'Por asignar',
          // Estado_Etapa ya no se envía - siempre es "Completada" por defecto en db.js
          Detalle: detalle,
          Observaciones: observaciones,
        });
      }

      if (files.length) {
        await uploadEvidenceFiles({
          caseId: casoId,
          followupId: savedFollowup.id,
          files,
        });
      }

      push({
        type: 'success',
        title: isEdit ? 'Seguimiento actualizado' : 'Seguimiento guardado',
        message: files.length
          ? 'Acción y evidencias registradas'
          : 'Acción registrada',
      });
      onSaved?.();

      // 🔄 Reset form (para modo creación)
      if (!isEdit) {
        setTipoAccion('');
        setEtapa('');
        setResponsable('');
        setDetalle('');
        setObservaciones('');
        setFiles([]);
        setFecha(new Date().toISOString().slice(0, 10));
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (e) {
      logger.error(e);

      // Detectar constraint de Postgres / Supabase para process_stage
      const isConstraintError =
        (e && (e.code === '23514' || (e.message && e.message.includes('ck_case_followups_process_stage')))) ||
        false;

      if (isConstraintError) {
        push({
          type: 'error',
          title: 'Etapa rechazada por la base de datos',
          message: `La BD rechazó la fase "${(etapa || '').trim()}" por una constraint. Revisa que stage_sla esté sincronizada.`,
        });
      } else {
        push({
          type: 'error',
          title: 'Error al guardar',
          message: e?.message || 'Intenta nuevamente',
        });
      }

      alert('Error al guardar seguimiento: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-4 flex flex-col h-full"
    >
      <div className="space-y-3 overflow-y-auto flex-1">
        <select
          value={tipoAccion}
          onChange={(e) => {
            const val = e.target.value;
            setTipoAccion(val);
            // Autofill immediate attempt: si no está en edición y no hay etapa, aplicar sugerencia
            const suggested = ACTION_TO_STAGE[val];
            if (!isEdit && !etapa && suggested && validStageSet.has(suggested)) {
              setEtapa(suggested);
            }
          }}
          className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
          required
        >
          <option value="">Acción realizada</option>
          <optgroup label="Inicio y notificaciones">
            <option>Recepción de denuncia / reporte</option>
            <option>Notificación a estudiante</option>
            <option>Notificación a apoderados</option>
          </optgroup>
          <optgroup label="Antecedentes y entrevistas">
            <option>Recopilación de antecedentes</option>
            <option>Entrevista a estudiante</option>
            <option>Entrevista a apoderados</option>
            <option>Entrevista a testigos</option>
            <option>Solicitud/recepción de descargos</option>
          </optgroup>
          <optgroup label="Medidas y resolución">
            <option>Medida cautelar / resguardo</option>
            <option>Medida formativa / reparatoria</option>
            <option>Medida disciplinaria</option>
            <option>Resolución fundada</option>
            <option>Notificación de resolución</option>
          </optgroup>
          <optgroup label="Recursos y seguimiento">
            <option>Apelación / recurso</option>
            <option>Seguimiento</option>
          </optgroup>
        </select>
        <p className="text-xs text-gray-500">Qué hiciste (p. ej. citación, entrevista, resolución).</p>
        {ACTION_TO_STAGE[tipoAccion] && !isEdit && !etapa && validStageSet.has(ACTION_TO_STAGE[tipoAccion]) && (
          <p className="text-xs text-gray-600">Sugerencia de fase: <strong>{ACTION_TO_STAGE[tipoAccion]}</strong></p>
        )}

        <select
          value={etapa}
          onChange={(e) => setEtapa((e.target.value || '').trim().replace(/\s+/g, ' '))}
          className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
          required
          disabled={stagesLoading}
        >
          <option value="">Fase del proceso</option>
          {stageOptions.map((k) => {
            const isHistorical = validStageSet.size > 0 && !validStageSet.has(k);
            return (
              <option key={k} value={k}>
                {k}{isHistorical ? ' (histórica)' : ''}
              </option>
            );
          })}
        </select>
        <p className="text-xs text-gray-500">Define dónde se mostrará en el acordeón (fases oficiales).</p>
        {stagesLoading && <p className="text-xs text-gray-500">Cargando fases oficiales…</p>}
        {stagesError && <p className="text-xs text-red-600">Error cargando fases: {stagesError}</p>}
        <p className="text-xs text-gray-500">Fases oficiales cargadas: {stageOptions.length}</p>
        <select
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
        >
          <option value="">Responsable</option>
          {RESPONSABLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <textarea
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Detalle de la acción"
          className="w-full border border-gray-300 bg-white rounded-lg p-3 min-h-[80px] text-gray-900"
        />

        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones"
          className="w-full border border-gray-300 bg-white rounded-lg p-3 min-h-[80px] text-gray-900"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Evidencias (opcional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full"
          />
          {files.length > 0 && (
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {files.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-3 border-t bg-white">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading
            ? 'Guardando…'
            : isEdit
              ? 'Actualizar acción'
              : 'Registrar acción'}
        </button>
      </div>
    </form>
  );
}
