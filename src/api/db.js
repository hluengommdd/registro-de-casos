import { supabase } from './supabaseClient';
import { withRetry } from './withRetry';
import { logger } from '../utils/logger';
import { normalizeCase } from '../domain/case';
import { getEvidencePublicUrl, getEvidenceSignedUrl } from './evidence';

const EMPTY = '';
const DEFAULT_STUDENT = 'N/A';
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
function formatStudent(students) {
  if (!students) return DEFAULT_STUDENT;
  const first = students.first_name || EMPTY;
  const last = students.last_name || EMPTY;
  const full = `${first} ${last}`.trim();
  return full || DEFAULT_STUDENT;
}

function mapCaseRow(row) {
  const formatted = {
    id: row.id,
    fields: {
      Estudiante_Responsable: {
        name: formatStudent(row.students),
        rut: (row.students && (row.students.rut ?? row.students?.RUT)) ?? null,
      },
      Fecha_Incidente: row.incident_date || EMPTY,
      Hora_Incidente: row.incident_time || EMPTY,
      Curso_Incidente: row.course_incident || EMPTY,
      Estado: row.status || EMPTY,
      Tipificacion_Conducta: row.conduct_type || EMPTY,
      Categoria: row.conduct_category || EMPTY,
      Descripcion: row.short_description || EMPTY,
      Responsable_Registro: row.responsible || EMPTY,
      Rol_Responsable: row.responsible_role || EMPTY,
      Acciones_Tomadas: EMPTY,
      Apoderado_Notificado: Boolean(row.guardian_notified),
      Fecha_Creacion: row.created_at || EMPTY,
      Fecha_Cierre: row.closed_at,
    },
    _supabaseData: row,
  };

  return normalizeCase(formatted);
}

export function buildCaseInsert(fields = {}) {
  return {
    student_id: fields.Estudiante_ID || null,
    incident_date: fields.Fecha_Incidente || EMPTY,
    incident_time: fields.Hora_Incidente || EMPTY,
    status: fields.Estado || 'Reportado',
    conduct_type: fields.Tipificacion_Conducta || EMPTY,
    conduct_category: fields.Categoria || EMPTY,
    short_description: fields.Descripcion || EMPTY,
    course_incident: fields.Curso_Incidente || EMPTY,
    responsible: fields.Responsable_Registro || fields.Responsable || EMPTY,
    responsible_role: fields.Rol_Responsable || EMPTY,
  };
}

export function buildCaseUpdate(fields = {}) {
  const updates = {};
  if (fields.Estudiante_ID !== undefined)
    updates.student_id = fields.Estudiante_ID || null;
  if (fields.Estudiante_Responsable !== undefined)
    updates.student_name =
      typeof fields.Estudiante_Responsable === 'object'
        ? fields.Estudiante_Responsable.name || null
        : fields.Estudiante_Responsable || null;
  if (fields.Fecha_Incidente !== undefined)
    updates.incident_date = fields.Fecha_Incidente || EMPTY;
  if (fields.Hora_Incidente !== undefined)
    updates.incident_time = fields.Hora_Incidente || EMPTY;
  if (fields.Estado !== undefined) updates.status = fields.Estado || EMPTY;
  if (fields.Tipificacion_Conducta !== undefined)
    updates.conduct_type = fields.Tipificacion_Conducta || EMPTY;
  if (fields.Categoria !== undefined)
    updates.conduct_category = fields.Categoria || EMPTY;
  if (fields.Descripcion !== undefined)
    updates.short_description = fields.Descripcion || EMPTY;
  if (fields.Acciones_Tomadas !== undefined)
    updates.actions_taken = fields.Acciones_Tomadas || EMPTY;
  if (fields.Apoderado_Notificado !== undefined)
    updates.guardian_notified = Boolean(fields.Apoderado_Notificado);
  if (fields.Curso_Incidente !== undefined)
    updates.course_incident = fields.Curso_Incidente || EMPTY;
  if (fields.Responsable_Registro !== undefined)
    updates.responsible = fields.Responsable_Registro || EMPTY;
  if (fields.Rol_Responsable !== undefined)
    updates.responsible_role = fields.Rol_Responsable || EMPTY;

  // --- Campos nativos Supabase para cierre de caso (expediente final) ---
  // Estos campos se envían desde el frontend (CierreCasoPage) como claves directas.
  if (fields.closed_at !== undefined) updates.closed_at = fields.closed_at || null;
  if (fields.due_process_closed_at !== undefined)
    updates.due_process_closed_at = fields.due_process_closed_at || null;
  if (fields.final_resolution_text !== undefined)
    updates.final_resolution_text = fields.final_resolution_text || null;
  if (fields.final_disciplinary_measure !== undefined)
    updates.final_disciplinary_measure = fields.final_disciplinary_measure || null;
  if (fields.closed_by_name !== undefined)
    updates.closed_by_name = fields.closed_by_name || null;
  if (fields.closed_by_role !== undefined)
    updates.closed_by_role = fields.closed_by_role || null;
  if (fields.final_pdf_storage_path !== undefined)
    updates.final_pdf_storage_path = fields.final_pdf_storage_path || null;

  return updates;
}

function mapFollowupRow(row) {
  return {
    id: row.id,
    case_id: row.case_id,
    action_date: row.action_date,
    action_at: row.action_at || row.created_at,
    action_type: row.action_type,
    process_stage: row.process_stage,
    stage_status: row.stage_status,
    detail: row.detail,
    responsible: row.responsible,
    observations: row.observations,
    due_date: row.due_date,
    due_at: row.due_at,
    fields: {
      Caso_ID: row.case_id,
      Tipo_Accion: row.action_type || 'Monitoreo',
      Etapa_Debido_Proceso: row.process_stage || EMPTY,
      Fecha: row.action_date || EMPTY,
      Fecha_Seguimiento: row.action_date || EMPTY,
      Fecha_Plazo: row.due_date || EMPTY,
      Estado_Etapa: row.stage_status || 'Completada',
      Responsable: row.responsible || EMPTY,
      Detalle: row.detail || EMPTY,
      Observaciones: row.observations || EMPTY,
      Descripcion: row.description || EMPTY,
      Acciones: row.action_type || row.description || EMPTY,
    },
    // Para UI compacta: evidencias listas con URL firmada
    evidence_files: row.evidence_files || [],
    _supabaseData: row,
  };
}

function mapControlPlazoRow(row) {
  return {
    id: row.followup_id,
    fields: {
      Caso_ID: row.case_id,
      Tipo_Accion: row.tipo_accion || 'Monitoreo',
      Fecha_Seguimiento: row.fecha || EMPTY,
      Descripcion: row.descripcion || row.detalle || EMPTY,
      Detalle: row.detalle || EMPTY,
      Acciones: row.responsable || EMPTY,
      Responsable: row.responsable || EMPTY,
      Estado_Etapa: row.estado_etapa || EMPTY,
      Etapa_Debido_Proceso: row.etapa_debido_proceso || EMPTY,
      Estudiante_Responsable: {
        name: row.estudiante || EMPTY,
        rut: row.estudiante_rut ?? null,
      },
      Estado: row.estado_caso || EMPTY,
      Tipificacion_Conducta: row.tipificacion_conducta || EMPTY,
      Curso_Incidente: row.curso_incidente || EMPTY,
      Fecha_Incidente: row.fecha_incidente || EMPTY,
      Numero_Caso: row.legacy_case_number || EMPTY,
      Dias_Restantes: row.dias_restantes !== null ? row.dias_restantes : null,
      Alerta_Urgencia:
        row.alerta_urgencia || calcularAlerta(row.dias_restantes),
      Fecha_Plazo: row.fecha_plazo || EMPTY,
      CASOS_ACTIVOS: [row.case_id],
      // Backend-driven fields from v_control_plazos_plus
      days_to_due: row.days_to_due ?? null,
      stage_num_from: row.stage_num_from ?? null,
    },
    _supabaseData: row,
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
        .select(
          `
          *,
          students(first_name, last_name, rut)
        `,
        )
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
 * Obtener casos activos con select reducido (mejor perf en listados)
 * @returns {Promise<Array>}
 */
export async function getActiveCasesLite() {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .select(CASE_LIST_SELECT)
        .neq('status', 'Cerrado'),
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
      supabase
        .from('cases')
        .select(
          `
          *,
          students(first_name, last_name, rut)
        `,
        )
        .eq('id', id)
        .single(),
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
 * @param {Object} fields - Campos del caso (estructura Airtable)
 * @returns {Promise<Object>}
 */
export async function createCase(fields) {
  try {
    const insertData = buildCaseInsert(fields);

    // Temporal: mostrar payload para verificar keys antes del insert
    console.log('createCase payload', insertData);

    logger.debug('💾 Insertando en Supabase:', insertData);

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .insert([insertData])
        .select(
          `
          *,
          students(first_name, last_name, rut)
        `,
        )
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
 * @param {Object} fields - Campos a actualizar (estructura Airtable)
 * @returns {Promise<Object>}
 */
export async function updateCase(id, fields) {
  try {
    if (!id) {
      throw new Error('Se requiere id de caso');
    }

    const updates = buildCaseUpdate(fields);

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          students(first_name, last_name, rut)
        `,
        )
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
            stage_status: 'Completada',
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
              logger.warn('[getCaseFollowups] No se pudo firmar URL evidencia', {
                evidenceId: ev.id,
                error: e?.message || e,
              });
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
 * @param {Object} fields - Campos del seguimiento
 * @returns {Promise<Object>}
 */
export async function createFollowup(input) {
  try {
    // Soporta payload nuevo (snake_case) y legacy (fields.*)
    const isNew = Boolean(input?.case_id);

    const caseId = isNew ? input.case_id : input?.Caso_ID;
    if (!caseId) throw new Error('Se requiere case_id (o Caso_ID)');

    // action_date es DATE: YYYY-MM-DD
    const rawActionDate = isNew
      ? input.action_date
      : input?.Fecha_Seguimiento || input?.Fecha || null;

    const actionDate = (rawActionDate || new Date().toISOString()).toString().split('T')[0];

    const row = {
      case_id: caseId,
      action_date: actionDate,
      action_type: isNew ? input.action_type : input?.Tipo_Accion || 'Monitoreo',
      process_stage: isNew ? input.process_stage : input?.process_stage || input?.Etapa_Debido_Proceso || '',
      stage_status: isNew ? (input.stage_status || 'Completada') : input?.Estado_Etapa || 'Completada',
      detail: isNew ? (input.detail || '') : input?.Detalle || '',
      responsible: isNew ? (input.responsible || 'Sistema') : input?.Responsable || 'Sistema',
      observations: isNew ? (input.observations || '') : input?.Observaciones || '',
    };

    if (!row.process_stage) throw new Error('Se requiere process_stage');
    if (!row.action_type) throw new Error('Se requiere action_type');
    if (!row.stage_status) throw new Error('Se requiere stage_status');

    const { data, error } = await withRetry(() =>
      supabase.from('case_followups').insert([row]).select('*').single(),
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
 * @param {Object} fields - Campos estilo Airtable
 * @returns {Promise<Object>}
 */
export async function updateFollowup(idOrObj, fieldsMaybe = {}) {
  try {
    // Soportar:
    //  A) updateFollowup(id, legacyFields)
    //  B) updateFollowup({ id, ...payloadDirect })
    const id = typeof idOrObj === 'object' ? idOrObj?.id : idOrObj;
    const fields = typeof idOrObj === 'object' ? idOrObj : fieldsMaybe;

    if (!id) throw new Error('Se requiere id de seguimiento');

    const payload = {};

    // Payload directo
    if (fields.case_id) payload.case_id = fields.case_id;
    if (fields.action_date) payload.action_date = fields.action_date;
    if (fields.action_type) payload.action_type = fields.action_type;
    if (fields.process_stage) payload.process_stage = fields.process_stage;
    if (fields.stage_status) payload.stage_status = fields.stage_status;
    if (fields.detail !== undefined) payload.detail = fields.detail;
    if (fields.responsible !== undefined) payload.responsible = fields.responsible;
    if (fields.observations !== undefined) payload.observations = fields.observations;
    if (fields.description !== undefined) payload.description = fields.description;

    // Legacy
    const actionDate = fields.Fecha_Seguimiento || fields.Fecha || undefined;
    if (fields.Caso_ID) payload.case_id = fields.Caso_ID;
    if (actionDate) payload.action_date = actionDate;
    if (fields.Tipo_Accion) payload.action_type = fields.Tipo_Accion;
    if (fields.Etapa_Debido_Proceso) payload.process_stage = fields.Etapa_Debido_Proceso;
    if (fields.Estado_Etapa) payload.stage_status = fields.Estado_Etapa;
    if (fields.Detalle !== undefined) payload.detail = fields.Detalle;
    if (fields.Responsable !== undefined) payload.responsible = fields.Responsable;
    if (fields.Observaciones !== undefined) payload.observations = fields.Observaciones;
    if (fields.Descripcion !== undefined) payload.description = fields.Descripcion;

    logger.debug('📦 updateFollowup payload:', payload);

    const { data, error } = await withRetry(() =>
      supabase.from('case_followups').update(payload).eq('id', id).select().single(),
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
      .from('v_control_plazos_plus')
      .select('*')
      .order('dias_restantes', { ascending: true }),
  );
  if (error) throw error;
  return (data || []).map(mapControlPlazoRow);
}

// NUEVO: map para filas de v_control_alertas (wrapper indagación)
function mapControlAlertaRow(row) {
  return {
    id: row.id || row.case_id, // id estable
    fields: {
      Caso_ID: row.case_id,
      Tipo_Accion: 'Indagación', // o row.tipo_accion si lo agregas
      Fecha_Seguimiento: row.fecha || EMPTY,

      // UI usa estos nombres:
      Etapa_Debido_Proceso: row.etapa_debido_proceso || EMPTY,
      Dias_Restantes: row.dias_restantes !== null ? row.dias_restantes : null,
      Alerta_Urgencia:
        row.alerta_urgencia || calcularAlerta(row.dias_restantes),
      Fecha_Plazo: row.fecha_plazo || EMPTY,

      // para que el filtro por caso siga funcionando
      CASOS_ACTIVOS: [row.case_id],

      // extras si los necesitas en pantalla
      Estado: row.estado_caso || EMPTY,
      Tipificacion_Conducta: row.tipificacion_conducta || EMPTY,
      Curso_Incidente: row.curso_incidente || EMPTY,
      Fecha_Incidente: row.fecha_incidente || EMPTY,
      Numero_Caso: row.legacy_case_number || EMPTY,
    },
    _supabaseData: row,
  };
}

// NUEVO: fuente única de alertas (SLA indagación)
export async function getAllControlAlertas() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_alertas')
      .select('*')
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
        .from('v_control_plazos_plus')
        .select('*')
        .eq('case_id', caseId)
        .order('dias_restantes', { ascending: true }),
    );

    if (error) throw error;

    logger.debug('📊 Datos de v_control_plazos_plus:', data);

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
    _supabaseData: row,
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
    _supabaseData: row,
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
      .from('v_control_plazos_case_resumen')
      .select('fecha_plazo, dias_restantes, alerta_urgencia')
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
      .from('v_control_plazos_case_resumen')
      .select('case_id, fecha_plazo, dias_restantes, alerta_urgencia')
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
    .from("cases")
    .select(`*, students(rut,first_name,last_name,level,course)`)
    .eq("id", caseId)
    .single();
  if (error) throw error;
  return mapCaseRow(data);
}

export async function getInvolucrados(caseId) {
  // Tabla: public.involucrados (caso_id -> cases.id)
  if (!caseId) return [];
  const { data, error } = await supabase
    .from("involucrados")
    .select("*")
    .eq("caso_id", caseId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}
