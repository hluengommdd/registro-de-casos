import { useEffect, useRef, useState } from 'react'
import { createFollowup, updateFollowup } from '../api/db'
import { uploadEvidenceFiles } from '../api/evidence'
import { useToast } from '../hooks/useToast'

const RESPONSABLES = [
  'Inspector/a',
  'Director/a Ciclo Secundario',
  'Director/a Ciclo Primaria',
  'Coordinador/a Ciclo Secundario',
  'Coordinador/a Ciclo Primaria',
  'Psicologo/a',
  'Encargado/a Convivencia Escolar',
]

export default function SeguimientoForm({ casoId, defaultProcessStage = null, followup = null, onSaved }) {
  const isEdit = Boolean(followup?.id)
  const [tipoAccion, setTipoAccion] = useState('')
  const [etapa, setEtapa] = useState(defaultProcessStage || '')
  const [responsable, setResponsable] = useState('')
  const [detalle, setDetalle] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [files, setFiles] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const { push } = useToast()

  // Pre-cargar datos cuando se edita
  useEffect(() => {
    if (!followup) return
    const ff = followup.fields || {}
    setTipoAccion(ff.Tipo_Accion || ff.Acciones || '')
    setEtapa(ff.Etapa_Debido_Proceso || defaultProcessStage || '')
    setResponsable(ff.Responsable || '')
    setDetalle(ff.Detalle || ff.Descripcion || '')
    setObservaciones(ff.Observaciones || '')
    setFecha(ff.Fecha || ff.Fecha_Seguimiento || new Date().toISOString().slice(0, 10))
  }, [followup, defaultProcessStage])

  // Reset al salir de edición
  useEffect(() => {
    if (followup) return
    setTipoAccion('')
    setEtapa(defaultProcessStage || '')
    setResponsable('')
    setDetalle('')
    setObservaciones('')
    setFiles([])
    setFecha(new Date().toISOString().slice(0, 10))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [followup, defaultProcessStage])

  // Si cambia la etapa por defecto y no estamos editando, actualizar el select
  useEffect(() => {
    if (!isEdit && defaultProcessStage) {
      setEtapa(defaultProcessStage)
    }
  }, [defaultProcessStage, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipoAccion || !etapa) {
      push({ type: 'error', title: 'Datos incompletos', message: 'Selecciona tipo de acción y etapa' })
      return
    }

    try {
      setLoading(true)

      // 📅 Fecha base (registro/edición)
      const fechaISO = fecha || new Date().toISOString().slice(0, 10)

      let savedFollowup = null

      if (isEdit) {
        savedFollowup = await updateFollowup(followup.id, {
          Caso_ID: casoId,
          Fecha_Seguimiento: fechaISO,
          Tipo_Accion: tipoAccion,
          Etapa_Debido_Proceso: etapa,
          Descripcion: detalle || tipoAccion,
          Acciones: responsable || 'Por asignar',
          Responsable: responsable || 'Por asignar',
          Detalle: detalle,
          Observaciones: observaciones,
        })
      } else {
        savedFollowup = await createFollowup({
          Caso_ID: casoId,
          Fecha_Seguimiento: fechaISO,
          Tipo_Accion: tipoAccion,
          Etapa_Debido_Proceso: etapa,
          Descripcion: detalle || tipoAccion,
          Acciones: responsable || 'Por asignar',
          Responsable: responsable || 'Por asignar',
          // Estado_Etapa ya no se envía - siempre es "Completada" por defecto en db.js
          Detalle: detalle,
          Observaciones: observaciones,
        })
      }

      if (files.length) {
        await uploadEvidenceFiles({ caseId: casoId, followupId: savedFollowup.id, files })
      }

      push({
        type: 'success',
        title: isEdit ? 'Seguimiento actualizado' : 'Seguimiento guardado',
        message: files.length ? 'Acción y evidencias registradas' : 'Acción registrada',
      })
      onSaved?.()

      // 🔄 Reset form (para modo creación)
      if (!isEdit) {
        setTipoAccion('')
        setEtapa('')
        setResponsable('')
        setDetalle('')
        setObservaciones('')
        setFiles([])
        setFecha(new Date().toISOString().slice(0, 10))
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error al guardar', message: e?.message || 'Intenta nuevamente' })
      alert('Error al guardar seguimiento: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <select
        value={tipoAccion}
        onChange={e => setTipoAccion(e.target.value)}
        className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
        required
      >
        <option value="">Tipo de acción</option>
        <option>Denuncia/Reporte</option>
        <option>Entrevista Estudiante</option>
        <option>Citación Apoderados</option>
        <option>Investigación</option>
        <option>Resolución</option>
        <option>Seguimiento</option>
      </select>

      <select
        value={etapa}
        onChange={e => setEtapa(e.target.value)}
        className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
        required
      >
        <option value="">Etapa del debido proceso</option>
        <option>1. Comunicación/Denuncia</option>
        <option>2. Notificación Apoderados</option>
        <option>3. Recopilación Antecedentes</option>
        <option>4. Entrevistas</option>
        <option>5. Investigación/Análisis</option>
        <option>6. Resolución y Sanciones</option>
        <option>7. Apelación/Recursos</option>
        <option>8. Seguimiento</option>
      </select>

      <select
        value={responsable}
        onChange={e => setResponsable(e.target.value)}
        className="w-full border border-gray-300 bg-white rounded-lg p-3 text-gray-900"
      >
        <option value="">Responsable</option>
        {RESPONSABLES.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <textarea
        value={detalle}
        onChange={e => setDetalle(e.target.value)}
        placeholder="Detalle de la acción"
        className="w-full border border-gray-300 bg-white rounded-lg p-3 min-h-[80px] text-gray-900"
      />

      <textarea
        value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Observaciones"
        className="w-full border border-gray-300 bg-white rounded-lg p-3 min-h-[80px] text-gray-900"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Evidencias (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={e => setFiles(Array.from(e.target.files || []))}
          className="w-full"
        />
        {files.length > 0 && (
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {files.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? 'Guardando…' : isEdit ? 'Actualizar acción' : 'Registrar acción'}
      </button>
    </form>
  )
}
