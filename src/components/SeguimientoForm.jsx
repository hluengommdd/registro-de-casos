import React, { useEffect, useMemo, useState } from 'react';
import { createFollowup, getResponsables } from '../api/db';
import { uploadEvidenceFiles } from '../api/evidence';
import { DUE_PROCESS_STAGES } from '../constants/dueProcessStages';
import { useToast } from '../hooks/useToast';

const ACTION_TYPES = ['Entrevista', 'Notificación', 'Recopilación', 'Medida', 'Indagación', 'Resolución', 'Apelación', 'Monitoreo'];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function SeguimientoForm({
  caseId,
  defaultStage,
  stages = DUE_PROCESS_STAGES,
  onSaved,
}) {
  const { push } = useToast();
  const [responsables, setResponsables] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    action_type: '',
    process_stage: defaultStage || '',
    responsible: '',
    detail: '',
    observations: '',
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getResponsables();
        if (!cancelled) setResponsables(list || []);
      } catch {
        // silencioso; el input sigue siendo libre
        if (!cancelled) setResponsables([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(form.action_type && form.process_stage && form.detail?.trim());
  }, [form]);

  function addFiles(newFiles) {
    const arr = Array.from(newFiles || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const payload = {
        case_id: caseId,
        action_date: todayISODate(),
        action_type: form.action_type,
        process_stage: form.process_stage,
        stage_status: 'Completada',
        detail: form.detail,
        responsible: form.responsible || 'Sistema',
        observations: form.observations,
      };

      const followup = await createFollowup(payload);

      if (files.length) {
        await uploadEvidenceFiles({ caseId, followupId: followup.id, files });
      }

      push({
        type: 'success',
        title: 'Acción registrada',
        message: `${payload.process_stage} · ${payload.action_type}`,
      });

      setForm((s) => ({ ...s, action_type: '', detail: '', observations: '' }));
      setFiles([]);
      onSaved?.();
    } catch (e2) {
      push({
        type: 'error',
        title: 'No se pudo guardar',
        message: e2?.message || 'Revisa los datos e intenta de nuevo',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <label className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">Tipo de acción</div>
          <select
            value={form.action_type}
            onChange={(e) => setForm({ ...form, action_type: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm bg-white"
            required
          >
            <option value="">Selecciona</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <div className="text-xs font-semibold text-slate-600">Etapa del proceso</div>
          <select
            value={form.process_stage}
            onChange={(e) => setForm({ ...form, process_stage: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm bg-white"
            required
          >
            <option value="">Selecciona</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1">
        <div className="text-xs font-semibold text-slate-600">Responsable</div>
        <input
          list="responsables-datalist"
          value={form.responsible}
          onChange={(e) => setForm({ ...form, responsible: e.target.value })}
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Busca o escribe (ej: Juan Pérez)"
        />
        <datalist id="responsables-datalist">
          {responsables.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </label>

      <label className="space-y-1">
        <div className="text-xs font-semibold text-slate-600">Detalle</div>
        <textarea
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
          className="w-full border rounded-lg p-2 text-sm min-h-[96px]"
          placeholder="Describe la acción realizada…"
          required
        />
      </label>

      <label className="space-y-1">
        <div className="text-xs font-semibold text-slate-600">Observaciones</div>
        <textarea
          value={form.observations}
          onChange={(e) => setForm({ ...form, observations: e.target.value })}
          className="w-full border rounded-lg p-2 text-sm min-h-[72px]"
          placeholder="Opcional"
        />
      </label>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-600">Evidencias</div>

        <div
          className="border-2 border-dashed rounded-xl p-4 bg-slate-50 text-sm text-slate-600 flex flex-col items-center justify-center gap-2"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="font-medium">Arrastra y suelta archivos aquí</div>
          <div className="text-xs text-slate-500">o</div>
          <label className="text-blue-600 underline cursor-pointer text-sm">
            seleccionar desde tu equipo
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, idx) => (
              <li key={`${f.name}-${idx}`} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.name}</div>
                  <div className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Guardar acción'}
        </button>
      </div>
    </form>
  );
}
