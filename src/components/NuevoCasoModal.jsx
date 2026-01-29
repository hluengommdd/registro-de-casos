import { useEffect, useMemo, useState } from 'react';
import { createCase, addInvolucrado } from '../api/db';
import { logger } from '../utils/logger';
import { supabase } from '../api/supabaseClient';
import { useToast } from '../hooks/useToast';
import useConductCatalog from '../hooks/useConductCatalog';

export default function NuevoCasoModal({ onClose, onSaved }) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [curso, setCurso] = useState('');
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState('');
  const [rolEstudiante, setRolEstudiante] = useState('');
  const [tipo, setTipo] = useState('');
  const [conductas, setConductas] = useState([]);
  const [descripcionLibre, setDescripcionLibre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [involucradosTemp, setInvolucradosTemp] = useState([]);
  const [nombreInv, setNombreInv] = useState('');
  const [rolInv, setRolInv] = useState('');
  const [cursoInv, setCursoInv] = useState('');
  const [estudiantesInv, setEstudiantesInv] = useState([]);
  const [selectedEstInv, setSelectedEstInv] = useState('');
  const { push } = useToast();

  // ======= catálogo y config desde Context =======
  const { conductTypes, catalogRows, loading, error, refresh } =
    useConductCatalog();

  /* ================= CARGA CURSOS ================= */

  useEffect(() => {
    cargarCursos();
  }, []);

  async function cargarCursos() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('course')
        .not('course', 'is', null)
        .order('course');

      if (error) throw error;

      const cursosUnicos = [...new Set(data.map((s) => s.course))].filter(
        Boolean,
      );
      setCursos(cursosUnicos);
    } catch (error) {
      logger.error('Error cargando cursos:', error);
    }
  }

  /* ================= CARGA ESTUDIANTES POR CURSO ================= */

  useEffect(() => {
    if (!curso) {
      setEstudiantes([]);
      setEstudianteId('');
      return;
    }

    async function cargarEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, course')
          .eq('course', curso)
          .order('last_name');

        if (error) throw error;

        setEstudiantes(data || []);
      } catch (error) {
        logger.error('Error cargando estudiantes:', error);
      }
    }

    cargarEstudiantes();
  }, [curso]);

  // Cuando se selecciona un estudiante, autocompletar el campo de involucrados
  useEffect(() => {
    if (!estudianteId) return;
    const sel = estudiantes.find((s) => s.id === estudianteId);
    if (sel) {
      const nombreSel = `${sel.first_name} ${sel.last_name}`.trim();
      setNombreInv(nombreSel);
    }
  }, [estudianteId, estudiantes]);

  // Limpiar nombreInv cuando cambia el curso
  useEffect(() => {
    setNombreInv('');
    setEstudianteId('');
    setRolEstudiante('');
  }, [curso]);

  // cargar estudiantes para la sección Involucrados por curso seleccionado
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!cursoInv) {
        setEstudiantesInv([]);
        setSelectedEstInv('');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, course')
          .eq('course', cursoInv)
          .order('last_name');

        if (error) throw error;
        if (mounted) setEstudiantesInv(data || []);
      } catch (e) {
        logger.error('Error cargando estudiantes (involucrados):', e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [cursoInv]);

  // NOTE: Ahora el catálogo se carga vía ConductCatalogProvider

  // Map config por key (ej: "Leve", "Grave", ...)
  const typeConfigByKey = useMemo(() => {
    const m = new Map();
    for (const t of conductTypes || []) m.set(t.key, t);
    return m;
  }, [conductTypes]);

  // Tipos ordenados por sort_order de conduct_types
  const tipos = useMemo(() => {
    if (conductTypes?.length) {
      return [...conductTypes]
        .filter((t) => t.active !== false)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        .map((t) => t.key);
    }

    const unique = Array.from(
      new Set((catalogRows || []).map((r) => r.conduct_type)),
    ).filter(Boolean);
    return unique.sort((a, b) => a.localeCompare(b, 'es'));
  }, [conductTypes, catalogRows]);

  // Categorías agrupadas por tipo desde conduct_catalog
  const categoriasByType = useMemo(() => {
    const map = {};
    for (const r of catalogRows || []) {
      if (!r.conduct_type) continue;
      if (!map[r.conduct_type]) map[r.conduct_type] = [];
      map[r.conduct_type].push({
        text: r.conduct_category,
        sort: r.sort_order ?? 999,
      });
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.sort - b.sort);
      map[k] = map[k].map((x) => x.text);
    }
    return map;
  }, [catalogRows]);

  // Estilo color (hex => inline style, si no => clase tailwind)
  function getTipoStyleOrClass(key) {
    const cfg = typeConfigByKey.get(key);
    const color = cfg?.color;
    if (!color) return null;
    if (typeof color === 'string' && color.trim().startsWith('#')) {
      return {
        backgroundColor: color.trim(),
        borderColor: color.trim(),
        color: '#fff',
      };
    }
    return color;
  }

  function toggleConducta(texto) {
    setConductas((prev) =>
      prev.includes(texto) ? prev.filter((c) => c !== texto) : [...prev, texto],
    );
  }

  async function guardarCaso() {
    if (!fecha || !hora || !estudianteId || !tipo) {
      push({
        type: 'error',
        title: 'Datos incompletos',
        message: 'Completa fecha, hora, estudiante y tipo',
      });
      return;
    }

    try {
      setGuardando(true);

      // Convertir conductas seleccionadas a string separado por comas
      const categoriasConducta =
        conductas.length > 0 ? conductas.join(', ') : '';

      const casoData = {
        Fecha_Incidente: fecha,
        Hora_Incidente: hora,
        Estudiante_ID: estudianteId,
        Curso_Incidente: curso,
        Tipificacion_Conducta: tipo,
        Categoria: categoriasConducta,
        Descripcion: descripcionLibre,
        Estado: 'Reportado',
      };

      logger.debug('📝 Guardando caso con datos:', casoData);

      const nuevoCaso = await createCase(casoData);

      // Si hay involucrados temporales, guardarlos vinculados al nuevo caso
      if (involucradosTemp.length > 0) {
        try {
          await Promise.all(
            involucradosTemp.map((inv) =>
              addInvolucrado({
                caso_id: nuevoCaso.id,
                nombre: inv.nombre,
                rol: inv.rol,
                metadata: { curso: inv.curso },
              }),
            ),
          );
        } catch (e) {
          logger.error('Error guardando involucrados:', e);
          push({
            type: 'warning',
            title: 'Involucrados',
            message: 'No se pudieron guardar todos los involucrados',
          });
        }
      }

      push({
        type: 'success',
        title: 'Caso creado',
        message: 'El caso se guardó exitosamente',
      });
      alert('Caso creado correctamente');
      onSaved?.();
      onClose?.();
    } catch (e) {
      logger.error(e);
      push({
        type: 'error',
        title: 'Error al guardar',
        message: e?.message || 'Intenta nuevamente',
      });
      alert('Error al guardar el caso: ' + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto relative space-y-4 max-h-[90vh]">
        {/* Usar tarjeta consistente para el modal: estructura flex columna */}
        <div className="bg-white rounded-xl shadow-sm p-0 sm:p-0 relative flex flex-col h-full max-h-[90vh]">
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

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <h2 className="text-xl font-semibold">Nuevo Caso</h2>

            {/* FECHA / HORA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border rounded p-2 w-full"
              />
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="border rounded p-2 w-full"
              />
            </div>

            {/* SEGUNDA LINEA: Curso - Nombre (estudiante principal) - Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">Selecciona un curso</option>
                {cursos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={estudianteId}
                onChange={(e) => setEstudianteId(e.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">Selecciona un estudiante</option>
                {estudiantes.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.first_name} {est.last_name}
                  </option>
                ))}
              </select>

              <select
                value={rolEstudiante}
                onChange={(e) => setRolEstudiante(e.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">Selecciona rol</option>
                <option value="Afectado">Afectado</option>
                <option value="Agresor">Agresor</option>
                <option value="Testigo">Testigo</option>
                <option value="Denunciante">Denunciante</option>
              </select>
            </div>

            {/* TERCERA LINEA: TIPIFICACIÓN (desde BD) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Tipo de falta
              </label>
              <div className="flex gap-2 flex-wrap">
                {tipos.map((t) => {
                  const styleOrClass = getTipoStyleOrClass(t);
                  const selected = tipo === t;
                  const isInline =
                    styleOrClass && typeof styleOrClass === 'object';

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTipo(t);
                        setConductas([]);
                      }}
                      disabled={loading || !!error}
                      style={selected && isInline ? styleOrClass : undefined}
                      className={`px-3 py-1 rounded-full text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected
                          ? isInline
                            ? ''
                            : styleOrClass ||
                              'bg-gray-100 text-gray-800 border-gray-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {typeConfigByKey.get(t)?.label ?? t}
                    </button>
                  );
                })}
              </div>
              {loading && (
                <div className="mt-2 border bg-gray-50 p-3 rounded text-sm">
                  Cargando catálogo de conductas…
                </div>
              )}
              {error && (
                <div className="mt-2 border bg-red-50 text-red-700 p-3 rounded text-sm flex items-center justify-between">
                  <div>Error cargando catálogo: {error}</div>
                  <div>
                    <button
                      type="button"
                      onClick={() => refresh()}
                      className="ml-2 px-3 py-1 border rounded bg-white text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CONDUCTAS (desde BD) */}
            {tipo && !loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(categoriasByType[tipo] || []).map((texto) => (
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
              className="w-full border rounded p-2 text-sm resize-none"
              rows={3}
              placeholder="Relato breve y objetivo del hecho ocurrido…"
              value={descripcionLibre}
              onChange={(e) => setDescripcionLibre(e.target.value)}
            />

            {/* INVOLUCRADOS TEMPORALES (solo en el modal hasta guardar) */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">
                Involucrados (opcional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 items-end">
                <select
                  value={cursoInv}
                  onChange={(e) => setCursoInv(e.target.value)}
                  className="border p-3 rounded"
                >
                  <option value="">Selecciona curso</option>
                  {cursos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEstInv}
                  onChange={(e) => {
                    setSelectedEstInv(e.target.value);
                    const s = estudiantesInv.find(
                      (x) => x.id === e.target.value,
                    );
                    setNombreInv(s ? `${s.first_name} ${s.last_name}` : '');
                  }}
                  className="border p-3 rounded"
                >
                  <option value="">Selecciona estudiante</option>
                  {estudiantesInv.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>

                <select
                  value={rolInv}
                  onChange={(e) => setRolInv(e.target.value)}
                  className="border p-3 rounded"
                >
                  <option value="">Selecciona rol</option>
                  <option value="Afectado">Afectado</option>
                  <option value="Agresor">Agresor</option>
                  <option value="Testigo">Testigo</option>
                  <option value="Denunciante">Denunciante</option>
                </select>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNombreInv('');
                      setRolInv('');
                      setSelectedEstInv('');
                      setCursoInv('');
                    }}
                    className="px-3 py-2 border rounded w-full sm:w-auto"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!nombreInv.trim() || !rolInv) {
                        push({
                          type: 'error',
                          title: 'Involucrados',
                          message: 'Nombre y rol son requeridos',
                        });
                        return;
                      }
                      setInvolucradosTemp((prev) => [
                        ...prev,
                        {
                          nombre: nombreInv.trim(),
                          rol: rolInv,
                          curso: cursoInv || null,
                        },
                      ]);
                      setNombreInv('');
                      setRolInv('');
                      setSelectedEstInv('');
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
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium">{it.nombre}</div>
                        <div className="text-xs text-gray-600">{it.rol}</div>
                      </div>
                      <div>
                        <button
                          onClick={() =>
                            setInvolucradosTemp((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-sm text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACCIONES: footer siempre visible */}
          <div className="p-3 sm:p-4 border-t bg-white sticky bottom-0 flex justify-end gap-2">
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
              disabled={guardando || loading || !!error}
              className="btn-primary disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
