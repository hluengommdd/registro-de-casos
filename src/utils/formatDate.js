export function formatDate(fecha, withTime = false) {
  if (!fecha) return '—'

  // Si viene como "YYYY-MM-DD", evitar que JS lo interprete como UTC y corra el día
  const isDateOnly = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

  let d
  if (isDateOnly(fecha)) {
    const [y, m, day] = fecha.split('-').map(Number)
    // Crear fecha a mediodía en UTC para no “retroceder” por huso horario al renderizar
    d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0))
  } else {
    d = new Date(fecha)
  }

  if (isNaN(d.getTime())) return fecha

  const date = d.toLocaleDateString('es-CL')

  if (!withTime) return date

  const time = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${date} ${time}`
}
