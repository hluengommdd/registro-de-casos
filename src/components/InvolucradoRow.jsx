import { useState } from 'react'

export default function InvolucradoRow({ item, onUpdate, onDelete, readOnly }) {
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(item?.nombre || '')
  const [rol, setRol] = useState(item?.rol || '')

  function save() {
    if (!nombre.trim() || !rol) return
    onUpdate?.({ ...item, nombre: nombre.trim(), rol })
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 p-2 border rounded">
      {!editing ? (
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">{item.nombre}</div>
          <div className="text-xs px-2 py-1 bg-gray-100 rounded">{item.rol}</div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="border p-1 rounded flex-1" />
          <select value={rol} onChange={e => setRol(e.target.value)} className="border p-1 rounded">
            <option value="">Selecciona rol</option>
            <option value="Afectado">Afectado</option>
            <option value="Agresor">Agresor</option>
            <option value="Testigo">Testigo</option>
            <option value="Denunciante">Denunciante</option>
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!readOnly && (
          !editing ? (
            <>
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600">Editar</button>
              <button onClick={() => onDelete?.(item.id)} className="text-sm text-red-600">Eliminar</button>
            </>
          ) : (
            <>
              <button onClick={save} className="text-sm text-green-600">Guardar</button>
              <button onClick={() => { setEditing(false); setNombre(item.nombre); setRol(item.rol); }} className="text-sm text-gray-600">Cancelar</button>
            </>
          )
        )}
      </div>
    </div>
  )
}
