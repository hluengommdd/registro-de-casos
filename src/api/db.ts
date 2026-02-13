import { supabase } from './supabaseClient';
import { withRetry } from './withRetry';
import { logger } from '../utils/logger';
import { getEvidencePublicUrl, getEvidenceSignedUrl } from './evidence';

const EMPTY = '';
const CASE_LIST_SELECT = `
  id,
  created_at,
  incident_date,
  incident_time,
  status,
  conduct_type,
  conduct_category,
  short_description,
  course_incident,
  responsible,
  responsible_role,
  closed_at,
  seguimiento_started_at,
  indagacion_due_date,
  students(first_name, last_name, rut)
`;
const CONTROL_UNIFICADO_SELECT = `
  tipo,
  followup_id,
  case_id,
  legacy_case_number,
  estado_caso,
  tipificacion_conducta,
  fecha_incidente,
  curso_incidente,
  fecha,
  tipo_accion,
  estado_etapa,
  responsable,
  detalle,
  etapa_debido_proceso,
  descripcion,
  fecha_plazo,
  dias_restantes,
  alerta_urgencia,
  stage_num_from,
  days_to_due,
  student_id,
  estudiante,
  estudiante_rut,
  course,
  level
`;
const CASE_SELECT_FULL = `
  id,
  student_id,
  legacy_case_number,
  incident_date,
  incident_time,
  course_incident,
  conduct_type,
  conduct_category,
  short_description,
  status,
  created_at,
  updated_at,
  closed_at,
  indagacion_start_date,
  indagacion_due_date,
  seguimiento_started_at,
  due_process_closed_at,
  responsible,
  responsible_role,
  final_resolution_text,
  final_disciplinary_measure,
  closed_by_name,
  closed_by_role,
  final_pdf_storage_path,
  students(first_name, last_name, rut)
`;

/**
 * Obtener lista única de responsables desde case_followups
 */
export async function getResponsables() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('case_followups')
      .select('responsible')
      .not('responsible', 'is', null)
      .neq('responsible', '')
      .order('responsible'),
  );

  if (error) {
    logger.error('Error cargando responsables:', error);
    return [];
  }

  // Extraer valores únicos
  const unicos = [...new Set(data.map((row) => row.responsible))];
  return unicos.filter(Boolean).sort();
}
function mapCaseRow(row) {
  return {
    ...row,
  };
}

export function buildCaseInsert(payload: Record<string, any> = {}) {
  return {
    student_id: payload.student_id || null,
    incident_date: payload.incident_date || EMPTY,
    incident_time: payload.incident_time || EMPTY,
    status: payload.status || 'Reportado',
    conduct_type: payload.conduct_type || EMPTY,
    conduct_category: payload.conduct_category || EMPTY,
    short_description: payload.short_description || EMPTY,
    course_incident: payload.course_incident || EMPTY,
    responsible: payload.responsible || EMPTY,
    responsible_role: payload.responsible_role || EMPTY,
  };
}

export function buildCaseUpdate(payload: Record<string, any> = {}) {
  const updates: Record<string, any> = {};
  if (payload.student_id !== undefined)
    updates.student_id = payload.student_id || null;
  if (payload.incident_date !== undefined)
    updates.incident_date = payload.incident_date || EMPTY;
  if (payload.incident_time !== undefined)
    updates.incident_time = payload.incident_time || EMPTY;
  if (payload.status !== undefined) updates.status = payload.status || EMPTY;
  if (payload.conduct_type !== undefined)
    updates.conduct_type = payload.conduct_type || EMPTY;
  if (payload.conduct_category !== undefined)
    updates.conduct_category = payload.conduct_category || EMPTY;
  if (payload.short_description !== undefined)
    updates.short_description = payload.short_description || EMPTY;
  if (payload.course_incident !== undefined)
    updates.course_incident = payload.course_incident || EMPTY;
  if (payload.responsible !== undefined)
    updates.responsible = payload.responsible || EMPTY;
  if (payload.responsible_role !== undefined)
    updates.responsible_role = payload.responsible_role || EMPTY;

  // --- Campos nativos Supabase para cierre de caso (expediente final) ---
  // Estos campos se envían desde el frontend (CierreCasoPage) como claves directas.
  if (payload.closed_at !== undefined)
    updates.closed_at = payload.closed_at || null;
  if (payload.due_process_closed_at !== undefined)
    updates.due_process_closed_at = payload.due_process_closed_at || null;
  if (payload.final_resolution_text !== undefined)
    updates.final_resolution_text = payload.final_resolution_text || null;
  if (payload.final_disciplinary_measure !== undefined)
    updates.final_disciplinary_measure =
      payload.final_disciplinary_measure || null;
  if (payload.closed_by_name !== undefined)
    updates.closed_by_name = payload.closed_by_name || null;
  if (payload.closed_by_role !== undefined)
    updates.closed_by_role = payload.closed_by_role || null;
  if (payload.final_pdf_storage_path !== undefined)
    updates.final_pdf_storage_path = payload.final_pdf_storage_path || null;

  return updates;
}

function mapFollowupRow(row) {
  return {
    id: row.id,
    case_id: row.case_id,
    action_date: row.action_date,
    action_at: row.action_at || row.created_at,
    created_at: row.created_at,
    action_type: row.action_type,
    process_stage: row.process_stage,
    detail: row.detail,
    responsible: row.responsible,
    observations: row.observations,
    due_date: row.due_date,
    due_at: row.due_at,
    description: row.description,
    // Para UI compacta: evidencias listas con URL firmada
    evidence_files: row.evidence_files || [],
  };
}

function mapControlPlazoRow(row) {
  return {
    ...row,
    id: row.followup_id,
    alerta_urgencia: row.alerta_urgencia || calcularAlerta(row.dias_restantes),
  };
}

/**
 * Obtener casos (activos o cerrados)
 * @param {string} status - 'Activo', 'Cerrado', o null para todos
 * @returns {Promise<Array>}
 */
export async function getCases(status = null) {
  try {
    const { data, error } = await withRetry(() => {
      let query = supabase
        .from('cases')
        .select(CASE_SELECT_FULL)
        .order('incident_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      return query;
    });

    if (error) throw error;

    return (data || []).map(mapCaseRow);
  } catch (error) {
    logger.error('Error fetching cases:', error);
    throw error;
  }
}

/**
 * Obtener lista de casos con paginación y búsqueda (select reducido)
 * @param {Object} options
 * @param {string|null} options.status - estado exacto (ej: 'Cerrado')
 * @param {string|null} options.excludeStatus - estado a excluir (ej: 'Cerrado')
 * @param {string} options.search - texto de búsqueda
 * @param {number} options.page - página (1-based)
 * @param {number} options.pageSize - tamaño de página
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function getCasesPage({
  status = null,
  excludeStatus = null,
  search = '',
  page = 1,
  pageSize = 10,
} = {}) {
  try {
    const q = String(search || '').trim();
    const from = Math.max(0, (Number(page) - 1) * Number(pageSize));
    const to = Math.max(from, from + Number(pageSize) - 1);

    let studentIds = [];
    if (q) {
      const { data: studentsData, error: studentsError } = await withRetry(() =>
        supabase
          .from('students')
          .select('id')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,rut.ilike.%${q}%`)
          .limit(500),
      );
      if (studentsError) throw studentsError;
      studentIds = (studentsData || []).map((s) => s.id).filter(Boolean);
    }

    let query = supabase
      .from('cases')
      .select(CASE_LIST_SELECT, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (excludeStatus) query = query.neq('status', excludeStatus);

    if (q) {
      const orParts = [
        `course_incident.ilike.%${q}%`,
        `conduct_type.ilike.%${q}%`,
        `conduct_category.ilike.%${q}%`,
        `short_description.ilike.%${q}%`,
        `status.ilike.%${q}%`,
      ];
      if (studentIds.length > 0) {
        orParts.push(`student_id.in.(${studentIds.join(',')})`);
      }
      query = query.or(orParts.join(','));
    }

    const { data, error, count } = await withRetry(() =>
      query.order('incident_date', { ascending: false }).range(from, to),
    );

    if (error) throw error;
    return { rows: (data || []).map(mapCaseRow), total: count || 0 };
  } catch (error) {
    logger.error('Error fetching cases page:', error);
    throw error;
  }
}

/**
 * Obtener casos activos con select reducido (mejor perf en listados)
 * @returns {Promise<Array>}
 */
export async function getActiveCasesLite() {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from('cases').select(CASE_LIST_SELECT).neq('status', 'Cerrado'),
    );
    if (error) throw error;
    return (data || []).map(mapCaseRow);
  } catch (error) {
    logger.error('Error fetching active cases (lite):', error);
    throw error;
  }
}

/**
 * Obtener casos por IDs con select reducido (para alertas/sidebars)
 * @param {Array<string>} caseIds
 * @returns {Promise<Array>}
 */
export async function getCasesByIdsLite(caseIds = []) {
  try {
    const ids = (caseIds || []).filter(Boolean);
    if (ids.length === 0) return [];

    const { data, error } = await withRetry(() =>
      supabase.from('cases').select(CASE_LIST_SELECT).in('id', ids),
    );
    if (error) throw error;
    return (data || []).map(mapCaseRow);
  } catch (error) {
    logger.error('Error fetching cases by ids (lite):', error);
    throw error;
  }
}

/**
 * Obtener casos por estado (consulta filtrada en backend)
 * @param {string} status - valor exacto en la columna `status` de la BD
 * @returns {Promise<Array>}
 */
export async function getCasesByStatus(status) {
  try {
    if (!status) return [];

    // Select only the minimal columns required for the sidebar to improve perf
    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .select(
          `
          id,
          created_at,
          incident_date,
          status,
          course_incident,
          students(first_name, last_name, rut)
        `,
        )
        // Use case-insensitive match to avoid issues with capitalization
        .ilike('status', status)
        .order('incident_date', { ascending: false }),
    );

    if (error) throw error;
    return (data || []).map(mapCaseRow);
  } catch (error) {
    logger.error('Error fetching cases by status:', error);
    throw error;
  }
}

/**
 * Obtener casos que están en seguimiento según bandera de inicio de seguimiento
 * (más robusto que depender solo del string `status`).
 * Trae casos donde `seguimiento_started_at` IS NOT NULL y status != 'Cerrado'
 */
export async function getCasesEnSeguimiento() {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .select(
          `
          id,
          created_at,
          incident_date,
          status,
          course_incident,
          students(first_name, last_name, rut)
        `,
        )
        .not('seguimiento_started_at', 'is', null)
        .neq('status', 'Cerrado')
        .order('incident_date', { ascending: false }),
    );

    if (error) throw error;
    return (data || []).map(mapCaseRow);
  } catch (error) {
    logger.error('Error fetching cases en seguimiento:', error);
    throw error;
  }
}

/**
 * Obtener un caso por ID
 * @param {string} id - ID del caso
 * @returns {Promise<Object>}
 */
export async function getCase(id) {
  try {
    if (!id) {
      throw new Error('Se requiere id de caso');
    }

    const { data, error } = await withRetry(() =>
      supabase.from('cases').select(CASE_SELECT_FULL).eq('id', id).single(),
    );

    if (error) throw error;
    if (!data) return null;

    logger.debug('📋 Caso individual desde Supabase:', data);

    return mapCaseRow(data);
  } catch (error) {
    logger.error('Error fetching case:', error);
    throw error;
  }
}

/**
 * Crear un nuevo caso
 * @param {Object} payload - Datos del caso
 * @returns {Promise<Object>}
 */
export async function createCase(payload) {
  try {
    const insertData = buildCaseInsert(payload);

    // Temporal: mostrar payload para verificar keys antes del insert
    console.log('createCase payload', insertData);

    logger.debug('💾 Insertando en Supabase:', insertData);

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .insert([insertData])
        .select(CASE_SELECT_FULL)
        .single(),
    );

    if (error) throw error;

    return mapCaseRow(data);
  } catch (error) {
    logger.error('Error creating case:', error);
    throw error;
  }
}

/**
 * Actualizar un caso
 * @param {string} id - ID del caso
 * @param {Object} payload - Datos a actualizar
 * @returns {Promise<Object>}
 */
export async function updateCase(id, payload) {
  try {
    if (!id) {
      throw new Error('Se requiere id de caso');
    }

    const updates = buildCaseUpdate(payload);

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select(CASE_SELECT_FULL)
        .single(),
    );

    if (error) throw error;
    return mapCaseRow(data);
  } catch (error) {
    logger.error('Error updating case:', error);
    throw error;
  }
}

/**
 * Iniciar seguimiento de un caso (mueve de Reportado -> En Seguimiento)
 * - Setea status = 'En Seguimiento'
 * - Setea seguimiento_started_at si está NULL
 * Importante: esto permite que el caso aparezca en Sidebar/Seguimientos y active control de plazos.
 */
export async function startSeguimiento(caseId) {
  try {
    if (!caseId) throw new Error('Se requiere caseId');

    const nowIso = new Date().toISOString();

    // Preferir RPC para setear seguimiento_started_at + indagacion_due_date
    const { error: rpcError } = await withRetry(() =>
      supabase.rpc('start_due_process', {
        p_case_id: caseId,
        p_sla_days: 10,
      }),
    );

    if (rpcError) throw rpcError;

    // Crear followup inicial si el caso no tiene ninguno aún
    const { data: existing, error: followupCheckError } = await withRetry(() =>
      supabase
        .from('case_followups')
        .select('id')
        .eq('case_id', caseId)
        .limit(1),
    );

    if (followupCheckError) throw followupCheckError;

    if (!existing || existing.length === 0) {
      const { error: followupInsertError } = await withRetry(() =>
        supabase.from('case_followups').insert([
          {
            case_id: caseId,
            action_date: nowIso.slice(0, 10),
            action_type: 'Monitoreo',
            process_stage: '1. Notificación Estudiante/s',
            // stage_status eliminado - cada followup es una acción completada
            detail: 'Inicio del debido proceso',
            responsible: 'Sistema',
          },
        ]),
      );

      if (followupInsertError) throw followupInsertError;
    }

    return true;
  } catch (error) {
    logger.error('Error starting seguimiento:', error);
    throw error;
  }
}

/**
 * Obtener seguimientos (case_followups) para un caso
 * @param {string} caseId - ID del caso
 * @returns {Promise<Array>}
 */
export async function getCaseFollowups(caseId) {
  try {
    if (!caseId) throw new Error('Se requiere caseId');

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        // Traer evidencias relacionadas (FK followup_id -> followup_evidence.followup_id)
        .select('*, followup_evidence(*)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false }),
    );

    if (error) throw error;

    const rows = data || [];

    // Adjuntar URLs firmadas para descarga (bucket evidencias)
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const evidences = row.followup_evidence || [];
        const evidence_files = await Promise.all(
          evidences.map(async (ev) => {
            let url = '';
            try {
              url = await getEvidenceSignedUrl(ev.storage_path, 3600);
            } catch (e) {
              logger.warn(
                '[getCaseFollowups] No se pudo firmar URL evidencia',
                {
                  evidenceId: ev.id,
                  error: e?.message || e,
                },
              );
            }
            return {
              id: ev.id,
              filename: ev.file_name,
              url,
              storage_path: ev.storage_path,
              content_type: ev.content_type,
              file_size: ev.file_size,
              created_at: ev.created_at,
            };
          }),
        );

        return { ...row, evidence_files };
      }),
    );

    return enriched.map(mapFollowupRow);
  } catch (error) {
    logger.error('Error fetching followups:', error);
    throw error;
  }
}

/**
 * Crear un seguimiento
 * @param {Object} payload - Datos del seguimiento
 * @returns {Promise<Object>}
 */
export async function createFollowup(input) {
  try {
    const caseId = input?.case_id;
    if (!caseId) throw new Error('Se requiere case_id');

    // action_date es DATE: YYYY-MM-DD
    const rawActionDate = input?.action_date || null;
    const actionDate = (rawActionDate || new Date().toISOString())
      .toString()
      .split('T')[0];

    const row = {
      case_id: caseId,
      action_date: actionDate,
      action_type: input.action_type || 'Monitoreo',
      process_stage: input.process_stage || '',
      // stage_status eliminado - cada followup es una acción completada
      detail: input.detail || '',
      responsible: input.responsible || 'Sistema',
      observations: input.observations || '',
    };

    if (!row.process_stage) throw new Error('Se requiere process_stage');
    if (!row.action_type) throw new Error('Se requiere action_type');
    // stage_status ya no es requerido

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        .insert([row])
        .select(
          `id, case_id, action_date, action_type, process_stage, detail, responsible, observations, due_date, due_at, created_at, description, action_at`,
        )
        .single(),
    );
    if (error) throw error;

    return mapFollowupRow(data);
  } catch (error) {
    logger.error('Error creating followup:', error);
    throw error;
  }
}

/**
 * Actualizar un seguimiento existente
 * @param {string} id - ID del seguimiento (case_followups)
 * @param {Object} payload - Datos del seguimiento
 * @returns {Promise<Object>}
 */
export async function updateFollowup(
  id: string,
  payload: Record<string, any> = {},
) {
  try {
    if (!id) throw new Error('Se requiere id de seguimiento');

    const updatePayload: Record<string, any> = {};
    if (payload.case_id) updatePayload.case_id = payload.case_id;
    if (payload.action_date) updatePayload.action_date = payload.action_date;
    if (payload.action_type) updatePayload.action_type = payload.action_type;
    if (payload.process_stage)
      updatePayload.process_stage = payload.process_stage;
    // stage_status eliminado - no se permite actualizar esta columna
    if (payload.detail !== undefined) updatePayload.detail = payload.detail;
    if (payload.responsible !== undefined)
      updatePayload.responsible = payload.responsible;
    if (payload.observations !== undefined)
      updatePayload.observations = payload.observations;
    if (payload.description !== undefined)
      updatePayload.description = payload.description;

    logger.debug('📦 updateFollowup payload:', updatePayload);

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single(),
    );
    if (error) throw error;

    return mapFollowupRow(data);
  } catch (error) {
    logger.error('Error updating followup:', error);
    throw error;
  }
}

/**
 * Obtener todos los controles de plazos (vista global)
 * @returns {Promise<Array>}
 */
export async function getAllControlPlazos() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_unificado')
      .select(CONTROL_UNIFICADO_SELECT)
      .eq('tipo', 'seguimiento')
      .order('dias_restantes', { ascending: true }),
  );
  if (error) throw error;
  return (data || []).map(mapControlPlazoRow);
}

// NUEVO: map para filas de v_control_alertas (wrapper indagación)
function mapControlAlertaRow(row) {
  return {
    ...row,
    id: row.id || row.case_id, // id estable
    tipo_accion: row.tipo_accion || 'Indagación',
    alerta_urgencia: row.alerta_urgencia || calcularAlerta(row.dias_restantes),
  };
}

// NUEVO: fuente única de alertas (SLA indagación)
export async function getAllControlAlertas() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_unificado')
      .select(CONTROL_UNIFICADO_SELECT)
      .eq('tipo', 'indagacion')
      .order('dias_restantes', { ascending: true }),
  );
  if (error) throw error;
  return (data || []).map(mapControlAlertaRow);
}

/**
 * Obtener alertas y control de plazos desde v_control_plazos
 * @returns {Promise<Array>}
 */
export async function getControlPlazos(caseId) {
  try {
    // Guard clause: evita queries con caseId indefinido
    if (!caseId) return [];

    const { data, error } = await withRetry(() =>
      supabase
        .from('v_control_unificado')
        .select(CONTROL_UNIFICADO_SELECT)
        .eq('tipo', 'seguimiento')
        .eq('case_id', caseId)
        .order('dias_restantes', { ascending: true }),
    );

    if (error) throw error;

    logger.debug('📊 Datos de v_control_unificado (seguimiento):', data);

    return (data || []).map(mapControlPlazoRow);
  } catch (error) {
    logger.error('Error fetching control plazos:', error);
    throw error;
  }
}

function mapMessageRow(row) {
  const attachments = row.case_message_attachments || [];
  const enriched = attachments.map((a) => ({
    ...a,
    url: getEvidencePublicUrl(a.storage_path) || null,
  }));

  return {
    id: row.id,
    case_id: row.case_id,
    process_stage: row.process_stage,
    message: row.body ?? '',
    author: row.sender_name || 'Sistema',
    authorRole: row.sender_role || '',
    created_at: row.created_at,
    attachments: enriched,
  };
}

export async function getStageMessages(caseId, stage) {
  if (!caseId || !stage) return [];
  const { data, error } = await withRetry(() =>
    supabase
      .from('case_messages')
      .select('*, case_message_attachments(*)')
      .eq('case_id', caseId)
      .eq('process_stage', stage)
      .order('created_at', { ascending: true }),
  );
  if (error) throw error;
  return (data || []).map(mapMessageRow);
}

export async function createStageMessage({
  caseId,
  processStage,
  message,
  author,
  authorRole,
}) {
  if (!caseId) throw new Error('Se requiere caseId');
  if (!processStage) throw new Error('Se requiere processStage');
  if (!message?.trim()) throw new Error('Se requiere mensaje');

  const { data, error } = await withRetry(() =>
    supabase
      .from('case_messages')
      .insert([
        {
          case_id: caseId,
          process_stage: processStage,
          body: message.trim(),
          sender_name: author || 'Sistema',
          sender_role: authorRole || '',
        },
      ])
      .select('*, case_message_attachments(*)')
      .single(),
  );
  if (error) throw error;
  return mapMessageRow(data);
}

function mapCommentRow(row) {
  const attachments = row.case_message_attachments || [];
  const enriched = attachments.map((a) => ({
    ...a,
    url: getEvidencePublicUrl(a.storage_path) || null,
  }));

  return {
    id: row.id,
    case_id: row.case_id,
    parent_id: row.parent_id || null,
    message: row.body ?? '',
    author: row.sender_name || 'Sistema',
    authorRole: row.sender_role || '',
    is_urgent: Boolean(row.is_urgent),
    created_at: row.created_at,
    attachments: enriched,
  };
}

export async function getCaseComments(caseId, { onlyUrgent = false } = {}) {
  if (!caseId) return [];
  let q = supabase
    .from('case_messages')
    .select('*, case_message_attachments(*)')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (onlyUrgent) q = q.eq('is_urgent', true);
  const { data, error } = await withRetry(() => q);
  if (error) throw error;
  return (data || []).map(mapCommentRow);
}

export async function createCaseComment({
  caseId,
  content,
  parentId = null,
  isUrgent = false,
  senderName = 'Sistema',
  senderRole = '',
  userId = null,
}) {
  if (!caseId) throw new Error('Se requiere caseId');
  if (!content?.trim()) throw new Error('Se requiere contenido');

  const { data, error } = await withRetry(() =>
    supabase
      .from('case_messages')
      .insert([
        {
          case_id: caseId,
          body: content.trim(),
          parent_id: parentId,
          is_urgent: Boolean(isUrgent),
          sender_name: senderName || 'Sistema',
          sender_role: senderRole || '',
          user_id: userId,
        },
      ])
      .select('*, case_message_attachments(*)')
      .single(),
  );
  if (error) throw error;
  return mapCommentRow(data);
}

export async function setCommentUrgent(commentId, isUrgent) {
  if (!commentId) throw new Error('Se requiere commentId');
  const { data, error } = await withRetry(() =>
    supabase
      .from('case_messages')
      .update({ is_urgent: Boolean(isUrgent) })
      .eq('id', commentId)
      .select('*, case_message_attachments(*)')
      .single(),
  );
  if (error) throw error;
  return mapCommentRow(data);
}

/**
 * Calcular icono de alerta basado en días restantes
 * @param {number} diasRestantes
 * @returns {string}
 */
function calcularAlerta(diasRestantes) {
  if (diasRestantes === null || diasRestantes === undefined) {
    return '⏳ SIN PLAZO';
  }

  if (diasRestantes < 0) {
    return `🔴 VENCIDO (${diasRestantes} días)`;
  } else if (diasRestantes === 0) {
    return '🟠 VENCE HOY';
  } else if (diasRestantes <= 3) {
    return `🟡 PRÓXIMO (${diasRestantes} días)`;
  } else {
    return `✅ EN PLAZO (${diasRestantes} días)`;
  }
}

/** INVOLUCRADOS: CRUD helpers */

export async function addInvolucrado(payload) {
  try {
    // ensure metadata is jsonb
    const toInsert = { ...payload };
    if (toInsert.metadata && typeof toInsert.metadata !== 'object') {
      try {
        toInsert.metadata = JSON.parse(toInsert.metadata);
      } catch {
        // leave as-is
      }
    }

    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').insert([toInsert]).select().single(),
    );
    if (error) throw error;
    return data;
  } catch (e) {
    logger.error('Error creating involucrado:', e);
    throw e;
  }
}

export async function updateInvolucrado(id, patch) {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from('involucrados')
        .update(patch)
        .eq('id', id)
        .select()
        .single(),
    );
    if (error) throw error;
    return data;
  } catch (e) {
    logger.error('Error updating involucrado:', e);
    throw e;
  }
}

export async function deleteInvolucrado(id) {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').delete().eq('id', id).select().single(),
    );
    if (error) throw error;
    return data;
  } catch (e) {
    logger.error('Error deleting involucrado:', e);
    throw e;
  }
}

/**
 * Obtener todas las filas de stage_sla
 */
export async function getStageSlaRows() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('stage_sla')
      .select('stage_key, days_to_due')
      .order('stage_key', { ascending: true }),
  );
  if (error) throw error;
  return data || [];
}

/**
 * Obtener resumen de plazos del caso desde v_control_plazos_case_resumen
 * (1 fila por case_id: la más urgente)
 */
export async function getPlazosResumen(casoId) {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_unificado')
      .select('fecha_plazo, dias_restantes, alerta_urgencia')
      .eq('tipo', 'resumen')
      .eq('case_id', casoId)
      .maybeSingle(),
  );
  if (error) throw error;
  return data || null;
}

// Obtener resumen de plazos para muchos casos (evita 1 llamada por fila)
export async function getPlazosResumenMany(caseIds = []) {
  const ids = (caseIds || []).filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_unificado')
      .select('case_id, fecha_plazo, dias_restantes, alerta_urgencia')
      .eq('tipo', 'resumen')
      .in('case_id', ids),
  );
  if (error) throw error;

  const m = new Map();
  (data || []).forEach((r) => m.set(r.case_id, r));
  return m;
}

/**
 * Iniciar debido proceso: setea fechas de inicio/vencimiento y marca como "En Seguimiento"
 * Usa RPC para consistencia en DB
 * @param {string} caseId - ID del caso
 * @param {number} slaDays - Días hábiles para el plazo (default 10)
 */
export async function iniciarDebidoProceso(caseId, slaDays = 10) {
  try {
    if (!caseId) {
      throw new Error('Se requiere caseId para iniciar debido proceso');
    }

    logger.debug('🚀 Iniciando debido proceso:', { caseId, slaDays });

    const { data, error } = await supabase.rpc('start_due_process', {
      p_case_id: caseId,
      p_sla_days: slaDays,
    });

    if (error) {
      logger.error('❌ Error en RPC start_due_process:', error);
      throw error;
    }

    logger.debug('✅ Debido proceso iniciado:', data);
    return data;
  } catch (err) {
    logger.error('Error en iniciarDebidoProceso:', err);
    throw err;
  }
}

// =================== CONDUCT TYPES (config) ===================
export async function getConductTypes({ activeOnly = true } = {}) {
  let q = supabase
    .from('conduct_types')
    .select('id, key, label, color, sort_order, active')
    .order('sort_order', { ascending: true });

  if (activeOnly) q = q.eq('active', true);

  const { data, error } = await q;
  if (error) {
    logger.error('getConductTypes error:', error);
    throw error;
  }
  return data || [];
}

// =================== CONDUCT CATALOG ===================
export async function getConductCatalog({ activeOnly = true } = {}) {
  let q = supabase
    .from('conduct_catalog')
    .select('id, conduct_type, conduct_category, active, sort_order')
    .order('conduct_type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (activeOnly) q = q.eq('active', true);

  const { data, error } = await q;
  if (error) {
    logger.error('getConductCatalog error:', error);
    throw error;
  }
  return data || [];
}

export async function getConductasByType(tipo, { activeOnly = true } = {}) {
  if (!tipo) return [];

  let q = supabase
    .from('conduct_catalog')
    .select('conduct_category, sort_order, active')
    .eq('conduct_type', tipo)
    .order('sort_order', { ascending: true });

  if (activeOnly) q = q.eq('active', true);

  const { data, error } = await q;
  if (error) {
    logger.error('getConductasByType error:', error);
    throw error;
  }

  return (data || []).map((r) => r.conduct_category);
}

// --- Seguimientos Full Integration ---
export async function getCaseDetails(caseId) {
  const { data, error } = await supabase
    .from('cases')
    .select(`*, students(rut,first_name,last_name,level,course)`)
    .eq('id', caseId)
    .single();
  if (error) throw error;
  return mapCaseRow(data);
}

export async function getInvolucrados(caseId) {
  // Tabla: public.involucrados (caso_id -> cases.id)
  if (!caseId) return [];
  const { data, error } = await supabase
    .from('involucrados')
    .select('*')
    .eq('caso_id', caseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
