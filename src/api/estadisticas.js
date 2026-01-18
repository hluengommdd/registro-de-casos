import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

const EMPTY_STATS = {
  kpis: { casos_total: 0, abiertos: 0, cerrados: 0, promedio_cierre_dias: 0 },
  plazos: { total_plazos: 0, fuera_plazo: 0, dentro_plazo: 0, cumplimiento_pct: 0 },
  reincidencia: 0,
  mayorCarga: { responsable: 'Sin responsable', total: 0 },
  mayorNivel: { level: 'Desconocido', total: 0 },
  promedioSeguimientos: { promedio: 0 },
  promedioDiasPrimerSeguimiento: { promedio_dias: 0 },
  charts: { porMes: [], porTip: [], porCurso: [] },
}

function pickSingle(rowArray, fallback) {
  return rowArray?.[0] ?? fallback
}

/**
 * Cargar todas las estadísticas en rango de fechas
 * @param {string} desde - Fecha inicio (YYYY-MM-DD)
 * @param {string} hasta - Fecha fin (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function loadEstadisticas({ desde, hasta }) {
  try {
    console.log('📊 Cargando estadísticas:', { desde, hasta })

    // Validación: no enviar null a RPC
    if (!desde || !hasta) {
      console.warn('⚠️ Fechas vacías, retornando datos por defecto')
      return EMPTY_STATS
    }

    // Ejecutar todas las RPC en paralelo para mejor rendimiento
    const [
      kpisRes,
      plazosRes,
      reincRes,
      cargaRes,
      mayorNivelRes,
      promSegRes,
      promDiasRes,
      porMesRes,
      porTipRes,
      porCursoRes,
    ] = await Promise.all([
      withRetry(() => supabase.rpc('stats_kpis', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_cumplimiento_plazos', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_reincidencia', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_mayor_carga', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_mayor_nivel', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_promedio_seguimientos_por_caso', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_tiempo_primer_seguimiento', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_mes', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_tipificacion', { desde, hasta })),
      withRetry(() => supabase.rpc('stats_casos_por_curso', { desde, hasta })),
    ])

    // Manejo de errores consolidado
    const errors = [
      kpisRes.error,
      plazosRes.error,
      reincRes.error,
      cargaRes.error,
      mayorNivelRes.error,
      porMesRes.error,
      porTipRes.error,
      porCursoRes.error,
    ].filter(Boolean)

    if (errors.length) {
      throw new Error(`Error en RPC: ${errors[0].message}`)
    }

    // Extraer datos con valores por defecto
    const kpis = pickSingle(kpisRes.data, EMPTY_STATS.kpis)
    const plazos = pickSingle(plazosRes.data, EMPTY_STATS.plazos)
    const reincRow = pickSingle(reincRes.data, { estudiantes_reincidentes: 0 })
    const reincidencia = reincRow?.estudiantes_reincidentes ?? 0
    // Obtener lista de estudiantes reincidentes (>=2 casos) dentro del rango
    let reincidentesList = []
    try {
      const { data: casesInRange, error: casesErr } = await withRetry(() =>
        supabase
          .from('cases')
          .select('student_id, students(first_name, last_name)')
          .gte('incident_date', desde)
          .lte('incident_date', hasta)
      )

      if (!casesErr && casesInRange && casesInRange.length) {
        const counts = {}
        casesInRange.forEach(r => {
          const first = r.students?.first_name || ''
          const last = r.students?.last_name || ''
          const full = `${first} ${last}`.trim() || 'Sin nombre'
          counts[full] = (counts[full] || 0) + 1
        })

        reincidentesList = Object.entries(counts)
          .map(([estudiante, total]) => ({ estudiante, total }))
          .filter(x => x.total >= 2)
          .sort((a, b) => b.total - a.total)
      }
    } catch (e) {
      console.warn('No se pudo obtener lista de reincidentes:', e)
    }
    const mayorCarga = pickSingle(cargaRes.data, EMPTY_STATS.mayorCarga)
    const mayorNivel = pickSingle(mayorNivelRes.data, EMPTY_STATS.mayorNivel)
    const promedioSeguimientos = pickSingle(promSegRes.data, EMPTY_STATS.promedioSeguimientos)
    const promedioDiasPrimerSeguimiento = pickSingle(promDiasRes.data, EMPTY_STATS.promedioDiasPrimerSeguimiento)

    console.log('✅ Estadísticas cargadas:', { kpis, plazos, reincidencia, mayorCarga })

    return {
      kpis,
      plazos,
      reincidencia,
      reincidentes: reincidentesList,
      mayorCarga,
      mayorNivel,
      promedioSeguimientos,
      promedioDiasPrimerSeguimiento,
      charts: {
        porMes: porMesRes.data ?? EMPTY_STATS.charts.porMes,
        porTip: porTipRes.data ?? EMPTY_STATS.charts.porTip,
        porCurso: porCursoRes.data ?? EMPTY_STATS.charts.porCurso,
      },
    }
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error)
    throw error
  }
}

/**
 * Convertir año + semestre a fechas desde/hasta
 * @param {string|number} anio
 * @param {string} semestre - '1', '2', o 'Todos'
 * @returns {Object} { desde, hasta }
 */
export function getFechasFromAnioSemestre(anio, semestre) {
  if (!anio) {
    return { desde: null, hasta: null }
  }

  const anioNum = parseInt(anio, 10)

  if (semestre === '1') {
    // 1er semestre: 01-01 a 30-06
    return {
      desde: `${anioNum}-01-01`,
      hasta: `${anioNum}-06-30`,
    }
  } else if (semestre === '2') {
    // 2do semestre: 01-07 a 31-12
    return {
      desde: `${anioNum}-07-01`,
      hasta: `${anioNum}-12-31`,
    }
  } else {
    // Todos: año completo
    return {
      desde: `${anioNum}-01-01`,
      hasta: `${anioNum}-12-31`,
    }
  }
}
