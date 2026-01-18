import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

const BUCKET = 'evidencias'

function safeFileName(name = '') {
  return name.replace(/[^\w.\-()]/g, '_')
}

export async function uploadEvidenceFiles({ caseId, followupId, files = [] }) {
  if (!followupId) throw new Error('Falta followupId para evidencias')
  if (!files.length) return []

  // Resolver case_id real desde el followup
  const { data: followupRow, error: fuErr } = await withRetry(() =>
    supabase
      .from('case_followups')
      .select('case_id')
      .eq('id', followupId)
      .single()
  )
  if (fuErr) throw fuErr
  const realCaseId = followupRow?.case_id
  if (!realCaseId) throw new Error('No se pudo resolver case_id del followup')

  if (caseId && caseId !== realCaseId) {
    console.warn('[uploadEvidenceFiles] caseId no coincide con followup.case_id; usando realCaseId', {
      caseId,
      realCaseId,
      followupId,
    })
  }

  const uploadedRows = []

  for (const file of files) {
    const safeName = safeFileName(file.name)
    const path = `cases/${realCaseId}/followups/${followupId}/${Date.now()}_${safeName}`

    // 1) Subir a Storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (upErr) throw upErr

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
        .single()
    )

    if (dbErr) {
      // cleanup para evitar huérfanos
      await supabase.storage.from(BUCKET).remove([path])
      throw dbErr
    }

    uploadedRows.push(data)
  }

  return uploadedRows
}

export async function listEvidenceByFollowup(followupId) {
  if (!followupId) return []
  const { data, error } = await withRetry(() =>
    supabase
      .from('followup_evidence')
      .select('*')
      .eq('followup_id', followupId)
      .order('created_at', { ascending: false })
  )
  if (error) throw error
  return data || []
}

export async function getEvidenceSignedUrl(storagePath, seconds = 3600) {
  if (!storagePath) throw new Error('Falta storagePath para URL firmada')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, seconds)
  if (error) throw error
  return data.signedUrl
}

export async function deleteEvidence(row) {
  if (!row?.id) throw new Error('Fila de evidencia inválida')

  const { error: sErr } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path])
  if (sErr) throw sErr

  const { error: dErr } = await withRetry(() =>
    supabase
      .from('followup_evidence')
      .delete()
      .eq('id', row.id)
  )
  if (dErr) throw dErr
}
