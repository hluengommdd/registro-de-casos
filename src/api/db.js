import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

const EMPTY = ''
const DEFAULT_STUDENT = 'N/A'

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
      .order('responsible')
  )

  if (error) {
    console.error('Error cargando responsables:', error)
    return []
  }

  // Extraer valores únicos
  const unicos = [...new Set(data.map(row => row.responsible))]
  return unicos.filter(Boolean).sort()
}

function formatStudent(students) {
  if (!students) return DEFAULT_STUDENT
  const first = students.first_name || EMPTY
  const last = students.last_name || EMPTY
  const full = `${first} ${last}`.trim()
  return full || DEFAULT_STUDENT
}

function mapCaseRow(row) {
  return {
    id: row.id,
    fields: {
      Estudiante_Responsable: formatStudent(row.students),
      Fecha_Incidente: row.incident_date || EMPTY,
      Hora_Incidente: row.incident_time || EMPTY,
      Curso_Incidente: row.course_incident || EMPTY,
      Estado: row.status || EMPTY,
      Tipificacion_Conducta: row.conduct_type || EMPTY,
      Categoria: row.conduct_category || EMPTY,
      Descripcion: row.short_description || EMPTY,
      Acciones_Tomadas: EMPTY,
      Apoderado_Notificado: Boolean(row.guardian_notified),
      Fecha_Creacion: row.created_at || EMPTY,
      Fecha_Cierre: row.closed_at,
    },
    _supabaseData: row,
  }
}

function buildCaseInsert(fields = {}) {
  return {
    student_id: fields.Estudiante_ID || null,
    incident_date: fields.Fecha_Incidente || EMPTY,
    incident_time: fields.Hora_Incidente || EMPTY,
    status: fields.Estado || 'Reportado',
    conduct_type: fields.Tipificacion_Conducta || EMPTY,
    conduct_category: fields.Categoria || EMPTY,
    short_description: fields.Descripcion || EMPTY,
    course_incident: fields.Curso_Incidente || EMPTY,
  }
}

function buildCaseUpdate(fields = {}) {
  const updates = {}
  if (fields.Estudiante_ID !== undefined) updates.student_id = fields.Estudiante_ID || null
  if (fields.Estudiante_Responsable !== undefined) updates.student_name = fields.Estudiante_Responsable
  if (fields.Fecha_Incidente !== undefined) updates.incident_date = fields.Fecha_Incidente || EMPTY
  if (fields.Hora_Incidente !== undefined) updates.incident_time = fields.Hora_Incidente || EMPTY
  if (fields.Estado !== undefined) updates.status = fields.Estado || EMPTY
  if (fields.Tipificacion_Conducta !== undefined) updates.conduct_type = fields.Tipificacion_Conducta || EMPTY
  if (fields.Categoria !== undefined) updates.conduct_category = fields.Categoria || EMPTY
  if (fields.Descripcion !== undefined) updates.short_description = fields.Descripcion || EMPTY
  if (fields.Acciones_Tomadas !== undefined) updates.actions_taken = fields.Acciones_Tomadas || EMPTY
  if (fields.Apoderado_Notificado !== undefined) updates.guardian_notified = Boolean(fields.Apoderado_Notificado)
  if (fields.Curso_Incidente !== undefined) updates.course_incident = fields.Curso_Incidente || EMPTY
  return updates
}

function mapFollowupRow(row) {
  return {
    id: row.id,
    fields: {
      Caso_ID: row.case_id,
      Tipo_Accion: row.action_type || 'Seguimiento',
      Etapa_Debido_Proceso: row.process_stage || EMPTY,
      Fecha: row.action_date || EMPTY,
      Fecha_Seguimiento: row.action_date || EMPTY,
      Fecha_Plazo: row.due_date || EMPTY,
      Estado_Etapa: row.stage_status || 'Completada',
      Responsable: row.responsible || EMPTY,
      Detalle: row.detail || EMPTY,
      Observaciones: row.observations || EMPTY,
      Descripcion: row.description || EMPTY,
      Acciones: row.action_type || row.description || EMPTY, // ✅ FIX: Mostrar tipo de acción o descripción
    },
    _supabaseData: row,
  }
}

function mapControlPlazoRow(row) {
  return {
    id: row.followup_id,
    fields: {
      Caso_ID: row.case_id,
      Tipo_Accion: row.tipo_accion || 'Seguimiento',
      Fecha_Seguimiento: row.fecha || EMPTY,
      Descripcion: row.descripcion || row.detalle || EMPTY,
      Detalle: row.detalle || EMPTY,
      Acciones: row.responsable || EMPTY,
      Responsable: row.responsable || EMPTY,
      Estado_Etapa: row.estado_etapa || EMPTY,
      Etapa_Debido_Proceso: row.etapa_debido_proceso || EMPTY,
      Estudiante_Responsable: row.estudiante || EMPTY,
      Estado: row.estado_caso || EMPTY,
      Tipificacion_Conducta: row.tipificacion_conducta || EMPTY,
      Curso_Incidente: row.curso_incidente || EMPTY,
      Fecha_Incidente: row.fecha_incidente || EMPTY,
      Numero_Caso: row.legacy_case_number || EMPTY,
      Dias_Restantes: row.dias_restantes !== null ? row.dias_restantes : null,
      Alerta_Urgencia: row.alerta_urgencia || calcularAlerta(row.dias_restantes),
      Fecha_Plazo: row.fecha_plazo || EMPTY,
      CASOS_ACTIVOS: [row.case_id],
      // Backend-driven fields from v_control_plazos_plus
      days_to_due: row.days_to_due ?? null,
      stage_num_from: row.stage_num_from ?? null,
    },
    _supabaseData: row,
  }
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
        .select(`
          *,
          students(first_name, last_name)
        `)
        .order('incident_date', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }
      return query
    })

    if (error) throw error

    return (data || []).map(mapCaseRow)
  } catch (error) {
    console.error('Error fetching cases:', error)
    throw error
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
        throw new Error('Se requiere id de caso')
      }

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .select(`
          *,
          students(first_name, last_name)
        `)
        .eq('id', id)
        .single()
    )

    if (error) throw error
    if (!data) return null

    console.log('📋 Caso individual desde Supabase:', data)

    return mapCaseRow(data)
  } catch (error) {
    console.error('Error fetching case:', error)
    throw error
  }
}

/**
 * Crear un nuevo caso
 * @param {Object} fields - Campos del caso (estructura Airtable)
 * @returns {Promise<Object>}
 */
export async function createCase(fields) {
  try {
    const insertData = buildCaseInsert(fields)

    console.log('💾 Insertando en Supabase:', insertData)

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .insert([insertData])
        .select(`
          *,
          students(first_name, last_name)
        `)
        .single()
    )

    if (error) throw error

    return mapCaseRow(data)
  } catch (error) {
    console.error('Error creating case:', error)
    throw error
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
      throw new Error('Se requiere id de caso')
    }

    const updates = buildCaseUpdate(fields)

    const { data, error } = await withRetry(() =>
      supabase
        .from('cases')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          students(first_name, last_name)
        `)
        .single()
    )

    if (error) throw error
    return mapCaseRow(data)
  } catch (error) {
    console.error('Error updating case:', error)
    throw error
  }
}

/**
 * Obtener seguimientos (case_followups) para un caso
 * @param {string} caseId - ID del caso
 * @returns {Promise<Array>}
 */
export async function getCaseFollowups(caseId) {
  try {
    if (!caseId) throw new Error('Se requiere caseId')

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
    )

    if (error) throw error

    return (data || []).map(mapFollowupRow)
  } catch (error) {
    console.error('Error fetching followups:', error)
    throw error
  }
}

/**
 * Crear un seguimiento
 * @param {Object} fields - Campos del seguimiento
 * @returns {Promise<Object>}
 */
export async function createFollowup(fields) {
  try {
    if (!fields?.Caso_ID) {
      throw new Error('Se requiere Caso_ID para crear seguimiento')
    }

    const actionDate = fields.Fecha_Seguimiento || new Date().toISOString().split('T')[0]
    const actionType = fields.Tipo_Accion || fields.Acciones || 'Seguimiento'
    const processStage = fields.Etapa_Debido_Proceso || 'Seguimiento'
    const stageStatus = 'Completada' // ✅ SIEMPRE Completada - si registras es porque ya lo hiciste

    console.log('📝 Creando followup con:', {
      case_id: fields.Caso_ID,
      action_date: actionDate,
      action_type: actionType,
      process_stage: processStage,
      stage_status: stageStatus,
    })

    // Construir objeto con los campos requeridos
    const payload = {
      case_id: fields.Caso_ID,
      action_date: actionDate,
      action_type: actionType,
      process_stage: processStage, // ✅ Campo requerido (NOT NULL en Supabase)
      stage_status: stageStatus, // ✅ NUEVO: Campo requerido (NOT NULL en Supabase)
    }

    // Agregar campos opcionales solo si tienen valor
    if (fields.Detalle || fields.Descripcion) {
      payload.detail = fields.Detalle || fields.Descripcion
    }
    if (fields.Descripcion) {
      payload.description = fields.Descripcion
    }
    if (fields.Responsable) {
      payload.responsible = fields.Responsable
    }
    if (fields.Observaciones) {
      payload.observations = fields.Observaciones
    }

    console.log('📦 Payload final:', payload)

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        .insert([payload])
        .select()
        .single()
    )

    if (error) {
      console.error('❌ Error en Supabase:', error)
      console.error('📦 Payload que causó el error:', payload)
      throw error
    }

    console.log('✅ Followup creado exitosamente:', data)
    return mapFollowupRow(data)
  } catch (error) {
    console.error('Error creating followup:', error)
    throw error
  }
}

/**
 * Actualizar un seguimiento existente
 * @param {string} id - ID del seguimiento (case_followups)
 * @param {Object} fields - Campos estilo Airtable
 * @returns {Promise<Object>}
 */
export async function updateFollowup(id, fields = {}) {
  try {
    if (!id) {
      throw new Error('Se requiere id de seguimiento')
    }

    // Mantener fecha previa si no se envía
    const actionDate = fields.Fecha_Seguimiento || fields.Fecha || undefined
    const payload = {}

    if (fields.Caso_ID) payload.case_id = fields.Caso_ID
    if (actionDate) payload.action_date = actionDate
    if (fields.Tipo_Accion || fields.Acciones) {
      payload.action_type = fields.Tipo_Accion || fields.Acciones
    }
    if (fields.Etapa_Debido_Proceso) payload.process_stage = fields.Etapa_Debido_Proceso

    // Siempre dejamos la etapa como completada si se edita
    payload.stage_status = fields.Estado_Etapa || 'Completada'

    if (fields.Detalle || fields.Descripcion) {
      payload.detail = fields.Detalle || fields.Descripcion
    }
    if (fields.Descripcion) payload.description = fields.Descripcion
    if (fields.Responsable) payload.responsible = fields.Responsable
    if (fields.Observaciones) payload.observations = fields.Observaciones

    const { data, error } = await withRetry(() =>
      supabase
        .from('case_followups')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    )

    if (error) throw error
    return mapFollowupRow(data)
  } catch (error) {
    console.error('Error updating followup:', error)
    throw error
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
      .order('dias_restantes', { ascending: true })
  )
  if (error) throw error
  return (data || []).map(mapControlPlazoRow)
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
      Alerta_Urgencia: row.alerta_urgencia || calcularAlerta(row.dias_restantes),
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
  }
}

// NUEVO: fuente única de alertas (SLA indagación)
export async function getAllControlAlertas() {
  const { data, error } = await withRetry(() =>
    supabase
      .from('v_control_alertas')
      .select('*')
      .order('dias_restantes', { ascending: true })
  )
  if (error) throw error
  return (data || []).map(mapControlAlertaRow)
}

/**
 * Obtener alertas y control de plazos desde v_control_plazos
 * @returns {Promise<Array>}
 */
export async function getControlPlazos(caseId) {
  try {
    // Guard clause: evita queries con caseId indefinido
    if (!caseId) return []

    const { data, error } = await withRetry(() =>
      supabase
        .from('v_control_plazos_plus')
        .select('*')
        .eq('case_id', caseId)
        .order('dias_restantes', { ascending: true })
    )

    if (error) throw error

    console.log('📊 Datos de v_control_plazos_plus:', data)

    return (data || []).map(mapControlPlazoRow)
  } catch (error) {
    console.error('Error fetching control plazos:', error)
    throw error
  }
}

/**
 * Calcular icono de alerta basado en días restantes
 * @param {number} diasRestantes
 * @returns {string}
 */
function calcularAlerta(diasRestantes) {
  if (diasRestantes === null || diasRestantes === undefined) {
    return '⏳ SIN PLAZO'
  }
  
  if (diasRestantes < 0) {
    return `🔴 VENCIDO (${diasRestantes} días)`
  } else if (diasRestantes === 0) {
    return '🟠 VENCE HOY'
  } else if (diasRestantes <= 3) {
    return `🟡 PRÓXIMO (${diasRestantes} días)`
  } else {
    return `✅ EN PLAZO (${diasRestantes} días)`
  }
}

/** INVOLUCRADOS: CRUD helpers */
export async function getInvolucrados(casoId) {
  try {
    if (!casoId) return []
    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').select('*').eq('caso_id', casoId).order('created_at', { ascending: true })
    )
    if (error) {
      console.error('Error fetching involucrados:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('Error in getInvolucrados:', e)
    return []
  }
}

export async function addInvolucrado(payload) {
  try {
    // ensure metadata is jsonb
    const toInsert = { ...payload }
    if (toInsert.metadata && typeof toInsert.metadata !== 'object') {
      try { toInsert.metadata = JSON.parse(toInsert.metadata) } catch {
        // leave as-is
      }
    }

    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').insert([toInsert]).select().single()
    )
    if (error) throw error
    return data
  } catch (e) {
    console.error('Error creating involucrado:', e)
    throw e
  }
}

export async function updateInvolucrado(id, patch) {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').update(patch).eq('id', id).select().single()
    )
    if (error) throw error
    return data
  } catch (e) {
    console.error('Error updating involucrado:', e)
    throw e
  }
}

export async function deleteInvolucrado(id) {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from('involucrados').delete().eq('id', id).select().single()
    )
    if (error) throw error
    return data
  } catch (e) {
    console.error('Error deleting involucrado:', e)
    throw e
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
      .order('stage_key', { ascending: true })
  )
  if (error) throw error
  return data || []
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
      .maybeSingle()
  )
  if (error) throw error
  return data || null
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
      throw new Error('Se requiere caseId para iniciar debido proceso')
    }

    console.log('🚀 Iniciando debido proceso:', { caseId, slaDays })

    const { data, error } = await supabase.rpc('start_due_process', {
      p_case_id: caseId,
      p_sla_days: slaDays,
    })

    if (error) {
      console.error('❌ Error en RPC start_due_process:', error)
      throw error
    }

    console.log('✅ Debido proceso iniciado:', data)
    return data
  } catch (err) {
    console.error('Error en iniciarDebidoProceso:', err)
    throw err
  }
}

