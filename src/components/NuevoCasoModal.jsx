import { useEffect, useMemo, useRef, useState } from 'react';
import { createCase, addInvolucrado } from '../api/db';
import { logger } from '../utils/logger';
import { supabase } from '../api/supabaseClient';
import { useToast } from '../hooks/useToast';
import useConductCatalog from '../hooks/useConductCatalog';
import { CARGOS } from '../constants/cargos';

export default function NuevoCasoModal({ onClose, onSaved }) {
  const firstFieldRef = useRef(null);
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

  // Responsable del registro (quién reporta el caso)
  const [responsableRegistro, setResponsableRegistro] = useState('');
  const [rolResponsable, setRolResponsable] = useState('');

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

  useEffect(() => {
    // Focus first field when opening the modal
    firstFieldRef.current?.focus();
  }, []);

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
        Responsable_Registro: responsableRegistro || 'Usuario Sistema',
        Rol_Responsable: rolResponsable || '',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo caso"
    >
      <div className="w-full max-w-5xl mx-auto relative space-y-4 max-h-[90vh]">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 relative flex flex-col h-full max-h-[90vh] overflow-hidden">
          {guardando && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10">
              <div className="text-gray-900 font-medium">Guardando…</div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Nuevo Caso
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 tap-target"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">

            {/* FECHA / HORA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Fecha del incidente
                </label>
                <input
                  ref={firstFieldRef}
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Hora</label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Curso / Estudiante / Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Curso</label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                <option value="">Selecciona un curso</option>
                {cursos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Estudiante</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                <option value="">Selecciona un estudiante</option>
                {estudiantes.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.first_name} {est.last_name}
                  </option>
                ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Rol</label>
                <select
                  value={rolEstudiante}
                  onChange={(e) => setRolEstudiante(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                <option value="">Selecciona rol</option>
                <option value="Afectado">Afectado</option>
                <option value="Agresor">Agresor</option>
                <option value="Testigo">Testigo</option>
                <option value="Denunciante">Denunciante</option>
                </select>
              </div>
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
                <div className="mt-2 border bg-red-100 text-red-800 p-3 rounded text-sm flex items-center justify-between">
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Descripción de los hechos
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows={4}
                placeholder="Descripción breve y objetiva del hecho ocurrido…"
                value={descripcionLibre}
                onChange={(e) => setDescripcionLibre(e.target.value)}
              />
            </div>

            {/* INVOLUCRADOS TEMPORALES (solo en el modal hasta guardar) */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">
                Involucrados (opcional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                <select
                  value={cursoInv}
                  onChange={(e) => setCursoInv(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                    className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 w-full sm:w-auto"
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
                    className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 w-full sm:w-auto"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {involucradosTemp.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {involucradosTemp.map((it, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm"
                    >
                      <span className="text-slate-800 font-medium">
                        {it.nombre}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {it.curso ? `${it.curso} • ` : ''}{it.rol}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setInvolucradosTemp((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="text-slate-500 hover:text-slate-700"
                        aria-label="Quitar"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Registro (responsable) */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold mb-2">
                Responsable del Registro
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-600 mb-4">
                  Define quién reporta el caso. Esto queda visible en el detalle y en listados.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Responsable del Registro
                    </label>
                    <input
                      type="text"
                      value={responsableRegistro}
                      onChange={(e) => setResponsableRegistro(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Puedes escribir el nombre del responsable.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Rol / Cargo
                    </label>
                    <select
                      value={rolResponsable}
                      onChange={(e) => setRolResponsable(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                    >
                      <option value="">Selecciona cargo</option>
                      {CARGOS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Opcional, pero recomendado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACCIONES: footer siempre visible */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 sticky bottom-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardarCaso}
              disabled={guardando || loading || !!error}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar Caso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
