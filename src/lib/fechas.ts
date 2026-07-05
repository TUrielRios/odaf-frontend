/**
 * Utilidades para fechas "de calendario" (sin hora).
 *
 * El backend guarda estos campos como DATEONLY ("YYYY-MM-DD").
 * No usar `new Date().toISOString().split("T")[0]` para obtener "hoy":
 * devuelve la fecha UTC, que después de las 21:00 hora argentina ya es
 * el día siguiente. Tampoco pasar un "YYYY-MM-DD" por
 * `new Date(str).toLocaleDateString()`: se interpreta como medianoche
 * UTC y en Argentina (UTC-3) se muestra corrido un día hacia atrás.
 */

/** Fecha de hoy en horario local como "YYYY-MM-DD". */
export function hoyLocal(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Formatea "YYYY-MM-DD" como fecha es-AR sin corrimiento de zona horaria. */
export function formatFecha(
  fecha: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!fecha) return "-"
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  if (!m) return new Date(fecha).toLocaleDateString("es-AR", options)
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString("es-AR", options)
}
