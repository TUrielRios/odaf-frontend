import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  Bell,
  Send,
  Clock,
  Calendar,
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  X,
  Eye,
} from 'lucide-react'
import { turnosApi, recordatoriosApi } from '../../api'
import type { Turno } from '../../types'

interface RemindersSectionProps {
  pacienteId: string
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({ pacienteId }) => {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [sentIds, setSentIds] = useState<Set<number>>(new Set())
  const [errorId, setErrorId] = useState<number | null>(null)
  const [template, setTemplate] = useState('')

  // Edit message modals
  const [editingWhatsAppTurno, setEditingWhatsAppTurno] = useState<Turno | null>(null)
  const [whatsAppMessageText, setWhatsAppMessageText] = useState('')
  
  const [editingEmailTurno, setEditingEmailTurno] = useState<Turno | null>(null)
  const [emailMessageText, setEmailMessageText] = useState('')
  const [emailPreviewHtml, setEmailPreviewHtml] = useState('')
  const [loadingEmailPreview, setLoadingEmailPreview] = useState(false)
  const [isSendingEmailCustom, setIsSendingEmailCustom] = useState(false)

  const fetchEmailPreview = async (turnoId: number, customMessage: string) => {
    try {
      setLoadingEmailPreview(true)
      const result = await recordatoriosApi.preview({
        turno_id: turnoId,
        custom_template: customMessage,
      })
      setEmailPreviewHtml(result.html)
    } catch (error) {
      console.error('Error loading email preview:', error)
      setEmailPreviewHtml('<p style="color:red;text-align:center;padding:40px;">Error al cargar la vista previa</p>')
    } finally {
      setLoadingEmailPreview(false)
    }
  }

  const handleSendReminderCustom = async () => {
    if (!editingEmailTurno) return
    try {
      setIsSendingEmailCustom(true)
      setErrorId(null)
      await recordatoriosApi.enviar(editingEmailTurno.id, emailMessageText)
      setSentIds((prev) => new Set(prev).add(editingEmailTurno.id))
      setEditingEmailTurno(null)
    } catch (error) {
      console.error('Error sending custom reminder:', error)
      setErrorId(editingEmailTurno.id)
      alert('Error al enviar el correo personalizado')
    } finally {
      setIsSendingEmailCustom(false)
    }
  }

  const handleOpenWhatsAppCustom = () => {
    if (!editingWhatsAppTurno) return
    const phone = cleanPhone(editingWhatsAppTurno.paciente?.telefono)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessageText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setEditingWhatsAppTurno(null)
  }

  useEffect(() => {
    fetchTurnos()
  }, [pacienteId])

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const result = await recordatoriosApi.obtenerTemplate()
        setTemplate(result.template || '')
      } catch (error) {
        console.error('Error fetching template:', error)
      }
    }
    fetchTemplate()
  }, [])

  const cleanPhone = (phoneStr?: string) => {
    if (!phoneStr) return ''
    let cleaned = phoneStr.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    if (cleaned.length === 10) {
      cleaned = '549' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('15')) {
      cleaned = '549' + cleaned.substring(2)
    } else if (!cleaned.startsWith('54') && cleaned.length >= 10) {
      cleaned = '54' + cleaned
    }
    return cleaned
  }

  const formatWhatsAppMessage = (turno: Turno, customTemplate?: string) => {
    const pacienteNombre = `${turno.paciente?.nombre || ''} ${turno.paciente?.apellido || ''}`.trim()
    const profesionalNombre = turno.profesional ? `${turno.profesional.nombre} ${turno.profesional.apellido}` : 'Profesional'
    const servicioNombre = turno.servicio?.nombre || 'Servicio'
    const fechaFormateada = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const hora = `${turno.hora_inicio} hs`

    if (customTemplate) {
      let msg = customTemplate
        .replace(/\{nombre\}/g, turno.paciente?.nombre || '')
        .replace(/\{apellido\}/g, turno.paciente?.apellido || '')
        .replace(/\{fecha\}/g, fechaFormateada)
        .replace(/\{hora_inicio\}/g, turno.hora_inicio)
        .replace(/\{hora_fin\}/g, turno.hora_fin || '')
        .replace(/\{profesional\}/g, profesionalNombre)
        .replace(/\{servicio\}/g, servicioNombre)
      
      return `Hola ${turno.paciente?.nombre || ''}! ⏰ Recordatorio de tu turno:\n\n${msg}\n\n📍 ODAF - Centro Odontológico\nTel:7711-5716\nWhatsaap 1140483693\n2 de Mayo 2930 Lanus Oeste`
    }

    return `Hola ${pacienteNombre}! ⏰ Te recordamos que tenés un turno programado:\n\n━━━━━━━━━━━━━━━\n🏥 *Servicio:* ${servicioNombre}\n👨‍⚕️ *Profesional:* ${profesionalNombre}\n📅 *Fecha:* ${fechaFormateada}\n🕐 *Horario:* ${hora}\n━━━━━━━━━━━━━━━\n\nPor favor, confirmá tu asistencia respondiendo a este mensaje. \n\n¡Te esperamos!\n📍 ODAF - Centro Odontológico\nTel:7711-5716\nWhatsaap 1140483693\n2 de Mayo 2930 Lanus Oeste`
  }

  const getInitialEmailText = (turno: Turno, templateText: string) => {
    const profesionalNombre = turno.profesional ? `${turno.profesional.nombre} ${turno.profesional.apellido}` : 'Profesional'
    const servicioNombre = turno.servicio?.nombre || 'Servicio'
    const fechaFormateada = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    if (templateText) {
      return templateText
        .replace(/\{nombre\}/g, turno.paciente?.nombre || '')
        .replace(/\{apellido\}/g, turno.paciente?.apellido || '')
        .replace(/\{fecha\}/g, fechaFormateada)
        .replace(/\{hora_inicio\}/g, turno.hora_inicio)
        .replace(/\{hora_fin\}/g, turno.hora_fin || '')
        .replace(/\{profesional\}/g, profesionalNombre)
        .replace(/\{servicio\}/g, servicioNombre)
    }
    
    return `Te recordamos que tenés un turno programado. A continuación, los detalles:`
  }

  const fetchTurnos = async () => {
    try {
      setLoading(true)
      // Fetch upcoming turnos for this patient
      const today = new Date().toISOString().split('T')[0]
      const response = await turnosApi.listar({
        paciente_id: pacienteId,
        fecha_desde: today,
        limit: 50,
      })
      // Filter only Pendiente/Confirmado
      const upcoming = (response.data || []).filter(
        (t: Turno) => ['Pendiente', 'Confirmado', 'Creado', 'Confirmado por email', 'Confirmado por SMS', 'Confirmado por Whatsapp'].includes(t.estado)
      )
      // Sort by date ascending
      upcoming.sort((a: Turno, b: Turno) => {
        const dateCompare = a.fecha.localeCompare(b.fecha)
        if (dateCompare !== 0) return dateCompare
        return a.hora_inicio.localeCompare(b.hora_inicio)
      })
      setTurnos(upcoming)
    } catch (error) {
      console.error('Error fetching turnos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (turnoId: number) => {
    try {
      setSendingId(turnoId)
      setErrorId(null)
      await recordatoriosApi.enviar(turnoId)
      setSentIds((prev) => new Set(prev).add(turnoId))
    } catch (error) {
      console.error('Error sending reminder:', error)
      setErrorId(turnoId)
    } finally {
      setSendingId(null)
    }
  }

  const formatDate = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Bell className="h-5 w-5 text-[#026498]" />
        <h3 className="text-lg font-semibold text-gray-900">Recordatorios de Turnos</h3>
      </div>

      <p className="text-sm text-gray-500">
        Envía recordatorios por email al paciente sobre sus próximos turnos.
      </p>

      {turnos.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay turnos próximos</p>
            <p className="text-sm text-gray-400 mt-1">
              El paciente no tiene turnos pendientes o confirmados a futuro.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {turnos.map((turno) => {
            const isSent = sentIds.has(turno.id)
            const isSending = sendingId === turno.id
            const hasError = errorId === turno.id

            return (
              <Card key={turno.id} className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="capitalize">{formatDate(turno.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {turno.hora_inicio} - {turno.hora_fin}
                    </div>
                    {turno.profesional && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4 text-gray-400" />
                        {turno.profesional.nombre} {turno.profesional.apellido}
                      </div>
                    )}
                    {turno.servicio && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        {turno.servicio.nombre}
                      </div>
                    )}
                    <div className="mt-1">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: turno.estado.includes('Confirmado') ? '#dcfce7' : '#fef3c7',
                          color: turno.estado.includes('Confirmado') ? '#166534' : '#92400e',
                        }}
                      >
                        {turno.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {turno.paciente?.telefono && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingWhatsAppTurno(turno)
                          setWhatsAppMessageText(formatWhatsAppMessage(turno, template))
                        }}
                        className="inline-flex items-center justify-center gap-2 px-3 h-9 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow hover:-translate-y-0.5 duration-150"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </Button>
                    )}

                    {isSent ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium h-9 px-3">
                        <CheckCircle className="h-5 w-5" />
                        Email Enviado
                      </div>
                    ) : hasError ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingEmailTurno(turno);
                            const initText = getInitialEmailText(turno, template);
                            setEmailMessageText(initText);
                            fetchEmailPreview(turno.id, initText);
                          }}
                          className="bg-[#026498] h-9 text-xs"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Reintentar Email
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEmailTurno(turno);
                          const initText = getInitialEmailText(turno, template);
                          setEmailMessageText(initText);
                          fetchEmailPreview(turno.id, initText);
                        }}
                        disabled={isSending}
                        className="bg-[#026498] h-9 text-xs"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            Enviando Email...
                          </>
                        ) : (
                          <>
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Enviar Email
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* WhatsApp Edit Modal */}
      {editingWhatsAppTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-100">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 rounded-lg">
                    <svg className="w-5 h-5 fill-emerald-600" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </span>
                  Editar Mensaje de WhatsApp
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Paciente: <span className="font-semibold">{editingWhatsAppTurno.paciente?.nombre} {editingWhatsAppTurno.paciente?.apellido}</span> · Tel: {editingWhatsAppTurno.paciente?.telefono}
                </p>
              </div>
              <button
                onClick={() => setEditingWhatsAppTurno(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Mensaje a enviar por WhatsApp
                </label>
                <textarea
                  value={whatsAppMessageText}
                  onChange={(e) => setWhatsAppMessageText(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none resize-none font-mono"
                  placeholder="Escribe el mensaje..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingWhatsAppTurno(null)}
                className="h-10 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenWhatsAppCustom}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white h-10 px-5 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Edit Modal */}
      {editingEmailTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-100">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </span>
                  Editar Recordatorio de Email
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Paciente: <span className="font-semibold">{editingEmailTurno.paciente?.nombre} {editingEmailTurno.paciente?.apellido}</span> · Email: {editingEmailTurno.paciente?.email}
                </p>
              </div>
              <button
                onClick={() => setEditingEmailTurno(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Texto del Mensaje (Párrafo del correo)
                  </label>
                  <textarea
                    value={emailMessageText}
                    onChange={(e) => setEmailMessageText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none resize-none font-sans"
                    placeholder="Escribe el párrafo del recordatorio..."
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEmailPreview(editingEmailTurno.id, emailMessageText)}
                    disabled={loadingEmailPreview}
                  >
                    {loadingEmailPreview ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Actualizar Vista Previa
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vista Previa de Email</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                    Así se enviará
                  </span>
                </div>
                <div className="flex-1 bg-white p-2 min-h-[350px]">
                  {loadingEmailPreview ? (
                    <div className="flex items-center justify-center h-full min-h-[350px]">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <iframe
                      srcDoc={emailPreviewHtml}
                      title="Custom Email Preview"
                      className="w-full h-full min-h-[350px] border-0"
                      sandbox=""
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingEmailTurno(null)}
                className="h-10 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendReminderCustom}
                disabled={isSendingEmailCustom}
                className="bg-[#026498] hover:bg-[#0c4a6e] text-white h-10 px-5 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                {isSendingEmailCustom ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-1.5" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
