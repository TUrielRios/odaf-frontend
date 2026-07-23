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
 * Mensaje de WhatsApp por defecto cuando no hay un template configurado.
 * Se mantiene idéntico al formato histórico. Es también la plantilla base que se
 * ofrece como ejemplo en el editor del default (ver WHATSAPP_TEMPLATE_EJEMPLO).
 */
const mensajeWhatsAppPorDefecto = (turno: Turno) => {
  const pacienteNombre = `${turno.paciente?.nombre || ""} ${turno.paciente?.apellido || ""}`.trim()
  const profesionalNombre = turno.profesional
    ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
    : "Profesional"
  const servicioNombre = turno.servicio?.nombre || "Servicio"
  const fechaFormateada = fechaLargaAR(turno.fecha)
  const hora = `${turno.hora_inicio} hs`

  return `Hola ${pacienteNombre}! ⏰ Te recordamos que tenés un turno programado:\n\n━━━━━━━━━━━━━━━\n🏥 *Servicio:* ${servicioNombre}\n👨‍⚕️ *Profesional:* ${profesionalNombre}\n📅 *Fecha:* ${fechaFormateada}\n🕐 *Horario:* ${hora}\n━━━━━━━━━━━━━━━\n\nPor favor, confirmá tu asistencia respondiendo a este mensaje. \n\n¡Te esperamos!\nTel:7711-5716\nWhatsaap 1140483693\n2 de Mayo 2930 Lanus Oeste`
}

/**
 * Plantilla de ejemplo (con variables) para precargar el editor del mensaje
 * default de WhatsApp. Equivale al mensaje por defecto, pero editable.
 */
export const WHATSAPP_TEMPLATE_EJEMPLO = `Hola {nombre}! ⏰ Te recordamos que tenés un turno programado:

━━━━━━━━━━━━━━━
🏥 *Servicio:* {servicio}
👨‍⚕️ *Profesional:* {profesional}
📅 *Fecha:* {fecha}
🕐 *Horario:* {hora_inicio} hs
━━━━━━━━━━━━━━━

Por favor, confirmá tu asistencia respondiendo a este mensaje.

¡Te esperamos!
Tel:7711-5716
Whatsaap 1140483693
2 de Mayo 2930 Lanus Oeste`

/**
 * Arma el mensaje completo de WhatsApp del recordatorio.
 * Si hay un template configurado, ese texto ES el mensaje completo (solo se
 * reemplazan las variables). Si no, usa el formato predeterminado.
 */
export const formatWhatsAppMessage = (turno: Turno, customTemplate?: string) => {
  if (customTemplate && customTemplate.trim()) {
    return reemplazarVariables(customTemplate, turno)
  }

  return mensajeWhatsAppPorDefecto(turno)
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
