import { useEffect, useState } from 'react'
import { createCase, addInvolucrado } from '../api/db'
import { supabase } from '../api/supabaseClient'
import { useToast } from '../hooks/useToast'

/* ================= TIPIFICACIONES ================= */

const TIPIFICACIONES = {
  Leve: [
    'Llegar atrasado(a) al inicio de la jornada escolar o después de los recreos, sin justificación.',
    'Asistir al establecimiento sin uniforme o con uniforme incompleto, sin autorización previa.',
    'Presentar deficiencia en la higiene o presentación personal.',
    'Asistir sin la agenda escolar correspondiente.',
    'No entregar circulares, comunicados o evaluaciones firmadas por el apoderado/a dentro del plazo establecido.',
    'Depositar basura o desperdicios fuera de los lugares habilitados.',
    'No justificar inasistencias ante el establecimiento dentro del tiempo indicado.',
    'Interrumpir el desarrollo normal de clases, actos o actividades institucionales.',
    'No entregar trabajos, tareas o evaluaciones en la fecha indicada.',
    'Asistir a clases sin materiales o sin las tareas requeridas.',
    'Comer dentro del aula sin autorización.',
    'Usar objetos que interfieran en el desarrollo de la clase.',
    'Utilizar pertenencias de otros sin consentimiento.',
    'Demostrar afecto físico inapropiado para el contexto educativo.',
    'No devolver materiales o libros a la biblioteca en el plazo acordado.'
  ],
  Grave: [
    'Faltar a la verdad u ocultar información relevante.',
    'Participar o promover disturbios.',
    'Lenguaje ofensivo o vulgar.',
    'Faltar el respeto a integrantes de la comunidad educativa.',
    'Agresión física o verbal.',
    'Copiar o difundir información durante evaluaciones.',
    'Ausentarse de clases sin autorización.',
    'Realizar colectas o ventas sin autorización.',
    'Uso de celular sin autorización.'
  ],
  'Muy Grave': [
    'Falsificar firmas o documentos.',
    'Dañar bienes del colegio.',
    'Participar en riñas.',
    'Abandonar el establecimiento sin autorización.',
    'Difusión de material pornográfico.',
    'Discriminación.',
    'Violencia física o psicológica.',
    'Amenazas u hostigamiento digital.',
    'Acoso escolar o bullying.'
  ],
  Gravísima: [
    'Violencia física grave (Ley Aula Segura).',
    'Lanzar objetos o líquidos peligrosos.',
    'Porte o uso de armas.',
    'Consumo o tráfico de drogas.',
    'Abuso o acoso sexual.'
  ]
}

/* ================= COLORES ================= */

const TIPOS_COLOR = {
  Leve: 'bg-green-100 text-green-800 border-green-200',
  Grave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Muy Grave': 'bg-purple-100 text-purple-800 border-purple-200',
  Gravísima: 'bg-red-100 text-red-800 border-red-200'
}

export default function NuevoCasoModal({ onClose, onSaved }) {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [curso, setCurso] = useState('')
  const [cursos, setCursos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [rolEstudiante, setRolEstudiante] = useState('')
  const [tipo, setTipo] = useState('')
  const [conductas, setConductas] = useState([])
  const [descripcionLibre, setDescripcionLibre] = useState('')
  // Estado se fija por defecto a 'Reportado' y no se muestra el selector
  const [guardando, setGuardando] = useState(false)
  const [involucradosTemp, setInvolucradosTemp] = useState([])
  const [nombreInv, setNombreInv] = useState('')
  const [rolInv, setRolInv] = useState('')
  const [cursoInv, setCursoInv] = useState('')
  const [estudiantesInv, setEstudiantesInv] = useState([])
  const [selectedEstInv, setSelectedEstInv] = useState('')
  const { push } = useToast()

  /* ================= CARGA CURSOS ================= */

  useEffect(() => {
    cargarCursos()
  }, [])

  async function cargarCursos() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('course')
        .not('course', 'is', null)
        .order('course')

      if (error) throw error

      // Obtener cursos únicos
      const cursosUnicos = [...new Set(data.map(s => s.course))].filter(Boolean)
      setCursos(cursosUnicos)
    } catch (error) {
      console.error('Error cargando cursos:', error)
    }
  }

  /* ================= CARGA ESTUDIANTES POR CURSO ================= */

  useEffect(() => {
    if (!curso) {
      setEstudiantes([])
      setEstudianteId('')
      return
    }

    async function cargarEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, course')
          .eq('course', curso)
          .order('last_name')

        if (error) throw error

        setEstudiantes(data || [])
      } catch (error) {
        console.error('Error cargando estudiantes:', error)
      }
    }

    cargarEstudiantes()
  }, [curso])

  // Cuando se selecciona un estudiante, autocompletar el campo de involucrados
  useEffect(() => {
    if (!estudianteId) return
    const sel = estudiantes.find(s => s.id === estudianteId)
    if (sel) {
      const nombreSel = `${sel.first_name} ${sel.last_name}`.trim()
      setNombreInv(nombreSel)
    }
  }, [estudianteId, estudiantes])

  // Limpiar nombreInv cuando cambia el curso
  useEffect(() => {
    setNombreInv('')
    setEstudianteId('')
    setRolEstudiante('')
  }, [curso])

  // cargar estudiantes para la sección Involucrados por curso seleccionado
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!cursoInv) {
        setEstudiantesInv([])
        setSelectedEstInv('')
        return
      }
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, course')
          .eq('course', cursoInv)
          .order('last_name')

        if (error) throw error
        if (mounted) setEstudiantesInv(data || [])
      } catch (e) {
        console.error('Error cargando estudiantes (involucrados):', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [cursoInv])

  function toggleConducta(texto) {
    setConductas(prev =>
      prev.includes(texto)
        ? prev.filter(c => c !== texto)
        : [...prev, texto]
    )
  }

  async function guardarCaso() {
    if (!fecha || !hora || !estudianteId || !tipo) {
      push({ type: 'error', title: 'Datos incompletos', message: 'Completa fecha, hora, estudiante y tipo' })
      return
    }

    try {
      setGuardando(true)
      
      // Convertir conductas seleccionadas a string separado por comas
      const categoriasConducta = conductas.length > 0 ? conductas.join(', ') : ''
      
      const casoData = {
        Fecha_Incidente: fecha,
        Hora_Incidente: hora,
        Estudiante_ID: estudianteId,
        Curso_Incidente: curso,
        Tipificacion_Conducta: tipo,
        Categoria: categoriasConducta,
        Descripcion: descripcionLibre,
        Estado: 'Reportado'
      }
      
      console.log('📝 Guardando caso con datos:', casoData)
      
      const nuevoCaso = await createCase(casoData)

      // Si hay involucrados temporales, guardarlos vinculados al nuevo caso
      if (involucradosTemp.length > 0) {
        try {
          await Promise.all(
            involucradosTemp.map(inv =>
              addInvolucrado({ caso_id: nuevoCaso.id, nombre: inv.nombre, rol: inv.rol, metadata: { curso: inv.curso } })
            )
          )
        } catch (e) {
          console.error('Error guardando involucrados:', e)
          push({ type: 'warning', title: 'Involucrados', message: 'No se pudieron guardar todos los involucrados' })
        }
      }

      push({ type: 'success', title: 'Caso creado', message: 'El caso se guardó exitosamente' })
      alert('Caso creado correctamente')
      onSaved?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error al guardar', message: e?.message || 'Intenta nuevamente' })
      alert('Error al guardar el caso: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl sm:max-w-4xl lg:max-w-6xl relative space-y-4">

        {/* Usar tarjeta consistente para el modal */}
        <div className="bg-white rounded-xl shadow-sm p-6 relative">

        {guardando && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10">
            <div className="text-gray-900 font-medium">Guardando…</div>
          </div>
        )}

        {/* CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold">Nuevo Caso</h2>

        {/* FECHA / HORA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border rounded p-2" />
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="border rounded p-2" />
        </div>

        {/* PRIMERA LINEA: fecha/hora (arriba) */}

        {/* SEGUNDA LINEA: Curso - Nombre (estudiante principal) - Rol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={curso}
            onChange={e => setCurso(e.target.value)}
            className="w-full border rounded p-3"
          >
            <option value="">Selecciona un curso</option>
            {cursos.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={estudianteId}
            onChange={e => setEstudianteId(e.target.value)}
            className="w-full border rounded p-3"
          >
            <option value="">Selecciona un estudiante</option>
            {estudiantes.map(est => (
              <option key={est.id} value={est.id}>{est.first_name} {est.last_name}</option>
            ))}
          </select>

          <select value={rolEstudiante} onChange={e => setRolEstudiante(e.target.value)} className="w-full border rounded p-3">
            <option value="">Selecciona rol</option>
            <option value="Afectado">Afectado</option>
            <option value="Agresor">Agresor</option>
            <option value="Testigo">Testigo</option>
            <option value="Denunciante">Denunciante</option>
          </select>
        </div>

        {/* TERCERA LINEA: TIPIFICACIÓN */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Tipo de falta
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(TIPIFICACIONES).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  setConductas([])
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  tipo === t
                    ? TIPOS_COLOR[t]
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* CONDUCTAS */}
        {tipo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIPIFICACIONES[tipo].map(texto => (
              <div
                key={texto}
                onClick={() => toggleConducta(texto)}
                className={`p-3 border rounded cursor-pointer text-sm ${
                  conductas.includes(texto)
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {texto}
              </div>
            ))}
          </div>
        )}

        {/* DESCRIPCIÓN */}
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          placeholder="Relato breve y objetivo del hecho ocurrido…"
          value={descripcionLibre}
          onChange={e => setDescripcionLibre(e.target.value)}
        />

        {/* NOTE: el selector de Estado se removió; el caso se marca como 'Reportado' por defecto */}

        {/* INVOLUCRADOS TEMPORALES (solo en el modal hasta guardar) */}
          <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Involucrados (opcional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 items-end">
            <select value={cursoInv} onChange={e => setCursoInv(e.target.value)} className="border p-3 rounded">
              <option value="">Selecciona curso</option>
              {cursos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={selectedEstInv} onChange={e => { setSelectedEstInv(e.target.value); const s = estudiantesInv.find(x=>x.id===e.target.value); setNombreInv(s ? `${s.first_name} ${s.last_name}` : '') }} className="border p-3 rounded">
              <option value="">Selecciona estudiante</option>
              {estudiantesInv.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>

            <select value={rolInv} onChange={e => setRolInv(e.target.value)} className="border p-3 rounded">
              <option value="">Selecciona rol</option>
              <option value="Afectado">Afectado</option>
              <option value="Agresor">Agresor</option>
              <option value="Testigo">Testigo</option>
              <option value="Denunciante">Denunciante</option>
            </select>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => { setNombreInv(''); setRolInv(''); setSelectedEstInv(''); setCursoInv('') }} className="px-3 py-2 border rounded w-full sm:w-auto">Limpiar</button>
              <button
                type="button"
                onClick={() => {
                  if (!nombreInv.trim() || !rolInv) {
                    push({ type: 'error', title: 'Involucrados', message: 'Nombre y rol son requeridos' })
                    return
                  }
                  setInvolucradosTemp(prev => [...prev, { nombre: nombreInv.trim(), rol: rolInv, curso: cursoInv || null }])
                  setNombreInv('')
                  setRolInv('')
                  setSelectedEstInv('')
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded w-full sm:w-auto"
              >
                Agregar
              </button>
            </div>
          </div>

          {involucradosTemp.length > 0 && (
            <div className="mt-3 space-y-2">
              {involucradosTemp.map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded">
                  <div>
                    <div className="font-medium">{it.nombre}</div>
                    <div className="text-xs text-gray-600">{it.rol}</div>
                  </div>
                  <div>
                    <button onClick={() => setInvolucradosTemp(prev => prev.filter((_, idx) => idx !== i))} className="text-sm text-red-600">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota: rol del estudiante principal ya se selecciona en la segunda línea */}

        {/* ACCIONES */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarCaso}
            disabled={guardando}
            className="btn-primary disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        </div>

      </div>
    </div>
  )
}
