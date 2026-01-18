export function formatDate(fecha, withTime = false) {
  if (!fecha) return '—'

  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha

  const date = d.toLocaleDateString('es-CL')

  if (!withTime) return date

  const time = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${date} ${time}`
}
