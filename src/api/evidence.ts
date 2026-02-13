import { supabase } from './supabaseClient';
import { withRetry } from './withRetry';
import { logger } from '../utils/logger';

const BUCKET = 'evidencias';

export function getEvidencePublicUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

function safeFileName(name = '') {
  return name.replace(/[^\w.\-()]/g, '_');
}

export async function uploadEvidenceFiles({ caseId, followupId, files = [] }) {
  if (!followupId) throw new Error('Falta followupId para evidencias');
  if (!files.length) return [];

  // Resolver case_id real desde el followup
  const { data: followupRow, error: fuErr } = await withRetry(() =>
    supabase
      .from('case_followups')
      .select('case_id')
      .eq('id', followupId)
      .single(),
  );
  if (fuErr) throw fuErr;
  const realCaseId = followupRow?.case_id;
  if (!realCaseId) throw new Error('No se pudo resolver case_id del followup');

  if (caseId && caseId !== realCaseId) {
    logger.warn(
      '[uploadEvidenceFiles] caseId no coincide con followup.case_id; usando realCaseId',
      {
        caseId,
        realCaseId,
        followupId,
      },
    );
  }

  const uploadedRows = [];

  for (const file of files) {
    const safeName = safeFileName(file.name);
    const path = `cases/${realCaseId}/followups/${followupId}/${Date.now()}_${safeName}`;

    // 1) Subir a Storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (upErr) throw upErr;

    // 2) Insertar en DB
    const { data, error: dbErr } = await withRetry(() =>
      supabase
        .from('followup_evidence')
        .insert([
          {
            case_id: realCaseId,
            followup_id: followupId,
            storage_bucket: BUCKET,
            storage_path: path,
            file_name: file.name,
            content_type: file.type,
            file_size: file.size,
          },
        ])
        .select()
        .single(),
    );

    if (dbErr) {
      // cleanup para evitar huérfanos
      await supabase.storage.from(BUCKET).remove([path]);
      throw dbErr;
    }

    uploadedRows.push(data);
  }

  return uploadedRows;
}

export async function listEvidenceByFollowup(followupId) {
  if (!followupId) return [];
  const { data, error } = await withRetry(() =>
    supabase
      .from('followup_evidence')
      .select(
        `id, case_id, followup_id, storage_bucket, storage_path, file_name, content_type, file_size, created_at`,
      )
      .eq('followup_id', followupId)
      .order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function getEvidenceSignedUrl(storagePath, seconds = 3600) {
  // Bucket es público: usar URL pública directo (más rápido y permite previews)
  const pub = getEvidencePublicUrl(storagePath);
  if (pub) return pub;

  if (!storagePath) throw new Error('Falta storagePath para URL firmada');
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteEvidence(row) {
  if (!row?.id) throw new Error('Fila de evidencia inválida');

  const { error: sErr } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path]);
  if (sErr) throw sErr;

  const { error: dErr } = await withRetry(() =>
    supabase.from('followup_evidence').delete().eq('id', row.id),
  );
  if (dErr) throw dErr;
}

export async function uploadMessageAttachments({
  caseId,
  messageId,
  files = [],
}) {
  if (!messageId) throw new Error('Falta messageId para adjuntos');
  if (!files.length) return [];

  // Resolver case_id real desde el mensaje
  const { data: msgRow, error: msgErr } = await withRetry(() =>
    supabase
      .from('case_messages')
      .select('case_id')
      .eq('id', messageId)
      .single(),
  );
  if (msgErr) throw msgErr;
  const realCaseId = msgRow?.case_id;
  if (!realCaseId) throw new Error('No se pudo resolver case_id del mensaje');

  if (caseId && caseId !== realCaseId) {
    logger.warn(
      '[uploadMessageAttachments] caseId no coincide con message.case_id; usando realCaseId',
      {
        caseId,
        realCaseId,
        messageId,
      },
    );
  }

  const uploadedRows = [];

  for (const file of files) {
    const safeName = safeFileName(file.name);
    const path = `cases/${realCaseId}/messages/${messageId}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (upErr) throw upErr;

    const { data, error: dbErr } = await withRetry(() =>
      supabase
        .from('case_message_attachments')
        .insert([
          {
            case_id: realCaseId,
            message_id: messageId,
            storage_bucket: BUCKET,
            storage_path: path,
            file_name: file.name,
            content_type: file.type,
            file_size: file.size,
          },
        ])
        .select()
        .single(),
    );

    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw dbErr;
    }

    uploadedRows.push(data);
  }

  return uploadedRows;
}
