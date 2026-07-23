/**
 * Helpers compartidos para armar los recordatorios de turno (Email y WhatsApp).
 *
 * Se centralizan acá para que la vista de Recordatorios y el envío desde el
 * detalle del turno (calendario) generen exactamente el mismo mensaje.
 */
import type { Turno } from "../types"

/**
 * Normaliza un teléfono argentino al formato E.164 usado por wa.me (54 9 …).
 * Mantiene la lógica histórica de la vista de Recordatorios.
 */
export const cleanPhone = (phoneStr?: string) => {
  if (!phoneStr) return ""
  let cleaned = phoneStr.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1)
  }
  if (cleaned.length === 10) {
    cleaned = "549" + cleaned
  } else if (cleaned.length === 11 && cleaned.startsWith("15")) {
    cleaned = "549" + cleaned.substring(2)
  } else if (!cleaned.startsWith("54") && cleaned.length >= 10) {
    cleaned = "54" + cleaned
  }
  return cleaned
}

/** Fecha larga en es-AR sin corrimiento de zona horaria (usa mediodía como ancla). */
const fechaLargaAR = (fecha: string) =>
  new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

/** Reemplaza las variables {nombre}, {fecha}, etc. de un template con los datos del turno. */
const reemplazarVariables = (template: string, turno: Turno) => {
  const profesionalNombre = turno.profesional
    ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
    : "Profesional"
  const servicioNombre = turno.servicio?.nombre || "Servicio"
  return template
    .replace(/\{nombre\}/g, turno.paciente?.nombre || "")
    .replace(/\{apellido\}/g, turno.paciente?.apellido || "")
    .replace(/\{fecha\}/g, fechaLargaAR(turno.fecha))
    .replace(/\{hora_inicio\}/g, turno.hora_inicio)
    .replace(/\{hora_fin\}/g, turno.hora_fin || "")
    .replace(/\{profesional\}/g, profesionalNombre)
    .replace(/\{servicio\}/g, servicioNombre)
}

/**
 * Arma el mensaje completo de WhatsApp del recordatorio.
 * Si hay un template personalizado, reemplaza sus variables; si no, usa el
 * formato predeterminado con los datos del turno.
 */
export const formatWhatsAppMessage = (turno: Turno, customTemplate?: string) => {
  const pacienteNombre = `${turno.paciente?.nombre || ""} ${turno.paciente?.apellido || ""}`.trim()
  const profesionalNombre = turno.profesional
    ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
    : "Profesional"
  const servicioNombre = turno.servicio?.nombre || "Servicio"
  const fechaFormateada = fechaLargaAR(turno.fecha)
  const hora = `${turno.hora_inicio} hs`

  if (customTemplate) {
    const msg = reemplazarVariables(customTemplate, turno)
    return `Hola ${turno.paciente?.nombre || ""}! ⏰ Recordatorio de tu turno:\n\n${msg}\n\n📍 ODAF - Centro Odontológico\nTel:7711-5716\nWhatsaap 1140483693\n2 de Mayo 2930 Lanus Oeste`
  }

  return `Hola ${pacienteNombre}! ⏰ Te recordamos que tenés un turno programado:\n\n━━━━━━━━━━━━━━━\n🏥 *Servicio:* ${servicioNombre}\n👨‍⚕️ *Profesional:* ${profesionalNombre}\n📅 *Fecha:* ${fechaFormateada}\n🕐 *Horario:* ${hora}\n━━━━━━━━━━━━━━━\n\nPor favor, confirmá tu asistencia respondiendo a este mensaje. \n\n¡Te esperamos!\nTel:7711-5716\nWhatsaap 1140483693\n2 de Mayo 2930 Lanus Oeste`
}

/**
 * Texto inicial (párrafo del correo) para el email del recordatorio.
 * Con template personalizado reemplaza variables; sin él, usa el texto por defecto.
 */
export const getInitialEmailText = (turno: Turno, templateText: string) => {
  if (templateText) {
    return reemplazarVariables(templateText, turno)
  }

  return `Te recordamos que tenés un turno programado. A continuación, los detalles:`
}
