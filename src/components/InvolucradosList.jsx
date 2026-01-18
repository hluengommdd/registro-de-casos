import { useEffect, useState } from 'react'
import { getInvolucrados, addInvolucrado, deleteInvolucrado } from '../api/db'
import { useToast } from '../hooks/useToast'
import InvolucradoRow from './InvolucradoRow'

const ROLES = ['Afectado', 'Agresor', 'Testigo', 'Denunciante']

export default function InvolucradosList({ casoId, readOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('')
  const { push } = useToast()

  useEffect(() => {
    if (!casoId) return setItems([])
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const data = await getInvolucrados(casoId)
        if (mounted) setItems(data || [])
      } catch (e) {
        console.error(e)
        if (mounted) {
          // silently fail on load
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [casoId])

  async function handleAdd() {
    if (!nombre.trim() || !rol) {
      push({ type: 'error', title: 'Datos', message: 'Nombre y rol son requeridos' })
      return
    }

    try {
      const created = await addInvolucrado({ caso_id: casoId, nombre: nombre.trim(), rol, contacto: null })
      setItems(prev => [...prev, created])
      setNombre('')
      setRol('')
      setShowForm(false)
      push({ type: 'success', title: 'Agregado', message: 'Involucrado agregado' })
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error', message: 'No se pudo agregar involucrado' })
    }
  }

  async function handleDelete(itemId) {
    try {
      await deleteInvolucrado(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
      push({ type: 'success', title: 'Eliminado', message: 'Involucrado eliminado' })
    } catch (e) {
      console.error(e)
      push({ type: 'error', title: 'Error', message: 'No se pudo eliminar involucrado' })
    }
  }

  if (!casoId) return <div className="text-sm text-slate-500 italic">No hay caso seleccionado.</div>

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Involucrados</h3>

      {loading ? (
        <div className="text-xs text-slate-400">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && <div className="text-sm text-slate-500 italic">No hay personas registradas.</div>}
          {items.map(it => (
            <div key={it.id} className="p-3 border border-slate-100 rounded-md bg-slate-50 flex items-center justify-between hover:border-slate-200 transition-colors">
              <div>
                <div className="font-semibold text-sm text-slate-800">{it.nombre}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">{it.rol}</span>
                  {it.metadata?.curso ? <span className="ml-1 text-slate-400">· {it.metadata.curso}</span> : ''}
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 border border-dashed border-slate-300 rounded text-sm text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all font-medium"
            >
              + Agregar involucrado
            </button>
          ) : (
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
              <select
                value={rol}
                onChange={e => setRol(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Selecciona rol</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => { setShowForm(false); setNombre(''); setRol('') }}
                  className="px-3 py-1.5 border border-slate-300 bg-white text-slate-600 rounded text-xs font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 bg-brand-600 text-white rounded text-xs font-medium hover:bg-brand-700 shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
