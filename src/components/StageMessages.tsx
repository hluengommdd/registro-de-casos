import { useEffect, useMemo, useState } from 'react';
import { createStageMessage, getStageMessages } from '../api/db';
import { uploadMessageAttachments } from '../api/evidence';
import { formatDate } from '../utils/formatDate';
import { useToast } from '../hooks/useToast';
import { CARGOS } from '../constants/cargos';

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function StageMessages({
  caseId,
  stageKey,
  readOnly = false,
  defaultSenderName = '',
  defaultSenderRole = '',
}: {
  caseId: string;
  stageKey: string;
  readOnly?: boolean;
  defaultSenderName?: string;
  defaultSenderRole?: string;
}) {
  const { push } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderRole, setSenderRole] = useState(defaultSenderRole);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!caseId || !stageKey) return;
      try {
        setLoading(true);
        const data = await getStageMessages(caseId, stageKey);
        if (!cancelled) setMessages(data || []);
      } catch (e) {
        if (!cancelled) {
          push({
            type: 'error',
            title: 'Mensajes',
            message: e?.message || 'No se pudieron cargar',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [caseId, stageKey, push]);

  const canSubmit = useMemo(() => text.trim().length > 0, [text]);

  function addFiles(newFiles: FileList | File[] | null) {
    const arr = Array.from(newFiles || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || saving) return;

    try {
      setSaving(true);
      const msg = await createStageMessage({
        caseId,
        processStage: stageKey,
        message: text.trim(),
        author: senderName || 'Sistema',
        authorRole: senderRole || '',
      });

      if (files.length) {
        await uploadMessageAttachments({
          caseId,
          messageId: msg.id,
          files,
        });
      }

      const refreshed = await getStageMessages(caseId, stageKey);
      setMessages(refreshed || []);
      setText('');
      setFiles([]);
    } catch (e2) {
      push({
        type: 'error',
        title: 'Mensajes',
        message: e2?.message || 'No se pudo guardar',
      });
    } finally {
      setSaving(false);
    }
  }

  const senderKey = (senderName || '').trim().toLowerCase();

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[520px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h4 className="text-sm font-bold text-slate-700">Mensajes</h4>
        </div>
        <span className="text-xs text-slate-500">
          {messages.length} mensaje{messages.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="p-4 bg-gradient-to-b from-slate-50/70 to-white flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando mensajes…</div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-500 shadow-sm">
              Sin mensajes en esta etapa
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const author = m.author || 'Sistema';
              const isSelf =
                senderKey && author.toLowerCase() === senderKey.toLowerCase();
              const initials = author
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((x) => x[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${
                    isSelf ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isSelf && (
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center border border-emerald-200">
                      {initials || 'U'}
                    </div>
                  )}

                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 py-2 shadow-sm border ${
                      isSelf
                        ? 'bg-sky-50 border-sky-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[11px] text-slate-500 mb-1">
                      {author}
                      {m.authorRole ? ` · ${m.authorRole}` : ''}
                    </div>
                    <div className="text-sm text-slate-800 whitespace-pre-wrap">
                      {m.message}
                    </div>

                    {m.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.attachments.map((a) => (
                          <a
                            key={a.id || a.storage_path}
                            href={a.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between text-[11px] text-blue-600 hover:underline"
                          >
                            <span className="truncate">{a.file_name}</span>
                            <span className="text-slate-500 ml-2">
                              {formatSize(a.file_size)}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 mt-1 text-right">
                      {formatDate(m.created_at, true)}
                    </div>
                  </div>

                  {isSelf && (
                    <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center border border-sky-200">
                      {initials || 'YO'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!readOnly && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-100 bg-white p-4 space-y-3 sticky bottom-0"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-600">
                Nombre
              </div>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full border rounded-xl p-2 text-sm bg-white"
                placeholder="Nombre del remitente"
                autoComplete="name"
              />
            </label>
            <label className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-600">
                Rol
              </div>
              <select
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                className="w-full border rounded-xl p-2 text-sm bg-white"
              >
                <option value="">Selecciona un rol</option>
                {CARGOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-3 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un mensaje para el equipo…"
              rows={2}
              className="flex-1 border rounded-2xl p-3 text-sm bg-white resize-none"
            />
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Enviando…' : 'Enviar'}
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              Adjuntos
            </label>
            <div
              className="mt-2 border border-dashed rounded-2xl p-3 bg-slate-50 text-xs text-slate-600 flex flex-col items-center justify-center gap-1"
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
              <label className="text-blue-600 underline cursor-pointer text-xs">
                seleccionar desde tu equipo
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
              {files.length > 0 && (
                <div className="text-[11px] text-slate-500">
                  {files.length} archivo{files.length === 1 ? '' : 's'}
                </div>
              )}
            </div>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, idx) => (
                  <li
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between text-[11px] text-slate-600"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
