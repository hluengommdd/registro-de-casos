import { useEffect, useMemo, useState } from 'react';
import { Star, CornerDownRight } from 'lucide-react';
import {
  createCaseComment,
  getCaseComments,
  setCommentUrgent,
} from '../api/db';
import { uploadMessageAttachments } from '../api/evidence';
import { formatDate } from '../utils/formatDate';
import { CARGOS } from '../constants/cargos';
import { useToast } from '../hooks/useToast';

function formatRelative(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Hace instantes';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function buildTree(list) {
  const map = new Map();
  const roots = [];
  list.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id).replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function TeamComments({
  caseId,
  readOnly = false,
  defaultSenderName = '',
  defaultSenderRole = '',
}) {
  const { push } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderRole, setSenderRole] = useState(defaultSenderRole);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!caseId) return;
      try {
        setLoading(true);
        const data = await getCaseComments(caseId, { onlyUrgent });
        if (!cancelled) setComments(data || []);
      } catch (e) {
        if (!cancelled) {
          push({
            type: 'error',
            title: 'Comentarios',
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
  }, [caseId, onlyUrgent, push]);

  const tree = useMemo(() => buildTree(comments || []), [comments]);

  function addFiles(newFiles, setter) {
    const arr = Array.from(newFiles || []);
    if (!arr.length) return;
    setter((prev) => [...prev, ...arr]);
  }

  function _removeFile(idx, setter) {
    setter((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || saving) return;
    try {
      setSaving(true);
      const msg = await createCaseComment({
        caseId,
        content: text.trim(),
        senderName: senderName || 'Sistema',
        senderRole,
      });
      if (files.length) {
        await uploadMessageAttachments({
          caseId,
          messageId: msg.id,
          files,
        });
      }
      const data = await getCaseComments(caseId, { onlyUrgent });
      setComments(data || []);
      setText('');
      setFiles([]);
    } catch (e2) {
      push({
        type: 'error',
        title: 'Comentarios',
        message: e2?.message || 'No se pudo guardar',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleReplySubmit(parentId) {
    if (!replyText.trim() || saving) return;
    try {
      setSaving(true);
      const msg = await createCaseComment({
        caseId,
        content: replyText.trim(),
        parentId,
        senderName: senderName || 'Sistema',
        senderRole,
      });
      if (replyFiles.length) {
        await uploadMessageAttachments({
          caseId,
          messageId: msg.id,
          files: replyFiles,
        });
      }
      const data = await getCaseComments(caseId, { onlyUrgent });
      setComments(data || []);
      setReplyText('');
      setReplyFiles([]);
      setReplyingTo(null);
    } catch (e2) {
      push({
        type: 'error',
        title: 'Comentarios',
        message: e2?.message || 'No se pudo guardar',
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleUrgent(c) {
    try {
      const updated = await setCommentUrgent(c.id, !c.is_urgent);
      setComments((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    } catch (e) {
      push({
        type: 'error',
        title: 'Comentarios',
        message: e?.message || 'No se pudo actualizar',
      });
    }
  }

  function renderComment(node, depth = 0) {
    const pad = Math.min(depth * 16, 48);
    return (
      <div key={node.id} style={{ marginLeft: pad }} className="space-y-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                {(node.author || 'U')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((x) => x[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {node.author || 'Sistema'}
                </div>
                <div className="text-xs text-slate-500">
                  {node.authorRole || '—'} · {formatRelative(node.created_at)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleUrgent(node)}
              className={`p-1 rounded-full tap-target ${
                node.is_urgent ? 'text-amber-500' : 'text-slate-400'
              }`}
              title="Marcar importante"
              aria-label="Marcar importante"
            >
              <Star size={16} fill={node.is_urgent ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
            {node.message}
          </div>

          {node.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {node.attachments.map((a) => (
                <a
                  key={a.id || a.storage_path}
                  href={a.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:shadow"
                >
                  <span className="truncate max-w-[180px]">{a.file_name}</span>
                  <span className="text-slate-500">
                    {formatSize(a.file_size)}
                  </span>
                </a>
              ))}
            </div>
          )}

          {!readOnly && (
            <div className="mt-3 flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setReplyingTo(replyingTo === node.id ? null : node.id)
                }
                className="flex items-center gap-1 text-brand-600 hover:text-brand-700"
              >
                <CornerDownRight size={14} />
                Responder
              </button>
              <span className="text-slate-500">
                {formatDate(node.created_at, true)}
              </span>
            </div>
          )}
        </div>

        {!readOnly && replyingTo === node.id && (
          <div className="ml-6 bg-white border border-slate-200 rounded-xl p-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="Responder…"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="text-xs text-slate-500">
                Adjuntos
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files, setReplyFiles)}
                />
              </label>
              <button
                type="button"
                onClick={() => handleReplySubmit(node.id)}
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold"
              >
                Enviar
              </button>
            </div>
            {replyFiles.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {replyFiles.length} archivo{replyFiles.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
        )}

        {node.replies?.length > 0 && (
          <div className="space-y-2">
            {node.replies.map((r) => renderComment(r, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">
            Discusión del equipo
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {comments.length} mensajes
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Solo urgentes
          <input
            type="checkbox"
            checked={onlyUrgent}
            onChange={(e) => setOnlyUrgent(e.target.checked)}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Cargando comentarios…</div>
      ) : tree.length === 0 ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
          Sin comentarios aún.
        </div>
      ) : (
        <div className="space-y-3">{tree.map((c) => renderComment(c))}</div>
      )}

      {!readOnly && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Nombre</div>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
                placeholder="Nombre del remitente"
                autoComplete="name"
              />
            </label>
            <label className="space-y-1">
              <div className="text-xs font-semibold text-slate-600">Rol</div>
              <select
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
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

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe una nueva nota para el equipo…"
            rows={3}
            className="w-full border rounded-lg p-3 text-sm bg-white"
          />

          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-slate-500">
              Adjuntos
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files, setFiles)}
              />
            </label>
            {files.length > 0 && (
              <span className="text-xs text-slate-500">
                {files.length} archivo{files.length === 1 ? '' : 's'}
              </span>
            )}
            <button
              type="submit"
              disabled={!text.trim() || saving}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Enviar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
