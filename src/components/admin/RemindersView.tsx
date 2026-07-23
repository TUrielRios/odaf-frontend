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
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Save,
  X,
  Info,
  MessageCircle,
} from 'lucide-react'
import { turnosApi, recordatoriosApi } from '../../api'
import type { Turno } from '../../types'
import { cleanPhone, formatWhatsAppMessage, getInitialEmailText, WHATSAPP_TEMPLATE_EJEMPLO } from '../../lib/recordatorio'

export const RemindersView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const sendingId = null
  const [sendingAll, setSendingAll] = useState(false)
  const [sentIds, setSentIds] = useState<Set<number>>(new Set())
  const [errorIds, setErrorIds] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [massResult, setMassResult] = useState<{ enviados: number; errores: number; total: number } | null>(null)

  // Template editor
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [configTab, setConfigTab] = useState<'email' | 'whatsapp'>('email')
  const [templateText, setTemplateText] = useState('')
  const [savedTemplate, setSavedTemplate] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  // WhatsApp default template (mensaje completo, separado del de email)
  const [whatsappTemplateText, setWhatsappTemplateText] = useState('')
  const [savedWhatsappTemplate, setSavedWhatsappTemplate] = useState('')
  const [savingWhatsappTemplate, setSavingWhatsappTemplate] = useState(false)

  // Preview modal
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewTurnoId, setPreviewTurnoId] = useState<number | null>(null)

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
      setErrorIds((prev) => {
        const next = new Set(prev)
        next.delete(editingEmailTurno.id)
        return next
      })
      await recordatoriosApi.enviar(editingEmailTurno.id, emailMessageText)
      setSentIds((prev) => new Set(prev).add(editingEmailTurno.id))
      setEditingEmailTurno(null)
    } catch (error) {
      console.error('Error sending custom reminder:', error)
      setErrorIds((prev) => new Set(prev).add(editingEmailTurno.id))
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
    setSentIds(new Set())
    setErrorIds(new Set())
    setMassResult(null)
  }, [selectedDate])

  useEffect(() => {
    if (!templateLoaded) {
      loadTemplate()
    }
  }, [])

  const loadTemplate = async () => {
    try {
      const [email, whatsapp] = await Promise.all([
        recordatoriosApi.obtenerTemplate('email'),
        recordatoriosApi.obtenerTemplate('whatsapp'),
      ])
      setTemplateText(email.template || '')
      setSavedTemplate(email.template || '')
      setWhatsappTemplateText(whatsapp.template || '')
      setSavedWhatsappTemplate(whatsapp.template || '')
      setTemplateLoaded(true)
    } catch (error) {
      console.error('Error loading template:', error)
      setTemplateLoaded(true)
    }
  }

  const fetchTurnos = async () => {
    try {
      setLoading(true)
      const response = await turnosApi.listar({
        fecha_desde: selectedDate,
        fecha_hasta: selectedDate,
        limit: 200,
      })
      const turnosFecha = (response.data || []).filter(
        (t: Turno) => t.fecha === selectedDate && ['Pendiente', 'Confirmado', 'Creado', 'Confirmado por email', 'Confirmado por SMS', 'Confirmado por Whatsapp'].includes(t.estado)
      )
      turnosFecha.sort((a: Turno, b: Turno) => a.hora_inicio.localeCompare(b.hora_inicio))
      setTurnos(turnosFecha)
    } catch (error) {
      console.error('Error fetching turnos:', error)
    } finally {
      setLoading(false)
    }
  }

  // const handleSendReminder = async (turnoId: number) => {
  //   try {
  //     setSendingId(turnoId)
  //     setErrorIds((prev) => {
  //       const next = new Set(prev)
  //       next.delete(turnoId)
  //       return next
  //     })
  //     await recordatoriosApi.enviar(turnoId)
  //     setSentIds((prev) => new Set(prev).add(turnoId))
  //   } catch (error) {
  //     console.error('Error sending reminder:', error)
  //     setErrorIds((prev) => new Set(prev).add(turnoId))
  //   } finally {
  //     setSendingId(null)
  //   }
  // }

  const handleUpdateStatus = async (turnoId: number, nuevoEstado: string) => {
    try {
      await turnosApi.actualizar(turnoId, { estado: nuevoEstado })
      if (nuevoEstado === 'Cancelado') {
        setTurnos((prev) => prev.filter((t) => t.id !== turnoId))
        alert('Turno cancelado correctamente')
      } else {
        setTurnos((prev) =>
          prev.map((t) => (t.id === turnoId ? { ...t, estado: nuevoEstado } : t))
        )
        alert('Turno confirmado por WhatsApp correctamente')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado del turno')
    }
  }

  const handleSendAll = async () => {
    if (!window.confirm(`¿Enviar recordatorio a todos los pacientes con turno el ${formatDate(selectedDate)}?`)) return

    try {
      setSendingAll(true)
      const result = await recordatoriosApi.enviarMasivo(selectedDate)
      setMassResult(result)
      const allIds = new Set(turnos.map(t => t.id))
      setSentIds(allIds)
    } catch (error) {
      console.error('Error sending mass reminders:', error)
      alert('Error al enviar recordatorios masivos')
    } finally {
      setSendingAll(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      setSavingTemplate(true)
      await recordatoriosApi.guardarTemplate(templateText, 'email')
      setSavedTemplate(templateText)
      alert('Mensaje de email guardado correctamente')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al guardar el mensaje')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleSaveWhatsappTemplate = async () => {
    try {
      setSavingWhatsappTemplate(true)
      await recordatoriosApi.guardarTemplate(whatsappTemplateText, 'whatsapp')
      setSavedWhatsappTemplate(whatsappTemplateText)
      alert('Mensaje de WhatsApp guardado correctamente')
    } catch (error) {
      console.error('Error saving whatsapp template:', error)
      alert('Error al guardar el mensaje')
    } finally {
      setSavingWhatsappTemplate(false)
    }
  }

  const handlePreview = async (turnoId?: number) => {
    try {
      setLoadingPreview(true)
      setShowPreview(true)
      setPreviewTurnoId(turnoId || null)

      const result = await recordatoriosApi.preview({
        turno_id: turnoId,
        custom_template: templateText || undefined,
      })
      setPreviewHtml(result.html)
    } catch (error) {
      console.error('Error loading preview:', error)
      setPreviewHtml('<p style="color:red;text-align:center;padding:40px;">Error al cargar la vista previa</p>')
    } finally {
      setLoadingPreview(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate + 'T00:00:00')
    date.setDate(date.getDate() + (direction === 'prev' ? -1 : 1))
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formatDate = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const filteredTurnos = turnos.filter((turno) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const pacienteName = `${turno.paciente?.apellido || ''} ${turno.paciente?.nombre || ''}`.toLowerCase()
    const profesionalName = `${turno.profesional?.nombre || ''} ${turno.profesional?.apellido || ''}`.toLowerCase()
    return pacienteName.includes(term) || profesionalName.includes(term)
  })

  const turnosWithEmail = filteredTurnos.filter(t => t.paciente?.email)
  const turnosWithoutEmail = filteredTurnos.filter(t => !t.paciente?.email)
  const templateChanged = templateText !== savedTemplate
  const whatsappTemplateChanged = whatsappTemplateText !== savedWhatsappTemplate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#026498]" />
            Recordatorios
          </h2>
          <p className="text-gray-600">Envía recordatorios de turno a los pacientes por email</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePreview()}
            className="border-[#026498] text-[#026498] hover:bg-blue-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver email de ejemplo
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className={showTemplateEditor ? 'bg-blue-50 border-[#026498] text-[#026498]' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar mensaje
          </Button>
        </div>
      </div>

      {/* Template Editor */}
      {showTemplateEditor && (
        <Card className="p-6 border-blue-200 bg-blue-50/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#026498]" />
                Configurar mensaje por defecto del recordatorio
              </h3>
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector de canal */}
            <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setConfigTab('email')}
                className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                  configTab === 'email' ? 'bg-white text-[#026498] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={() => setConfigTab('whatsapp')}
                className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                  configTab === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>

            {configTab === 'email' ? (
            <>
            <div className="bg-white border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Variables disponibles (se reemplazan automáticamente):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs font-mono">
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{nombre}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{apellido}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{fecha}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{hora_inicio}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{hora_fin}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{profesional}'}</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded">{'{servicio}'}</span>
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    Si dejás el campo vacío, se usará el mensaje predeterminado: "Te recordamos que tenés un turno programado..."
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto del mensaje (aparece después del saludo "Hola [nombre],")
              </label>
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                rows={4}
                placeholder='Ej: Te recordamos que tenés un turno el {fecha} a las {hora_inicio} con {profesional} para {servicio}. ¡Te esperamos!'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {templateChanged && (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Cambios sin guardar
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview()}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Vista previa
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="bg-[#026498]"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Guardar mensaje
                    </>
                  )}
                </Button>
              </div>
            </div>
            </>
            ) : (
            <>
            <div className="bg-white border border-emerald-100 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Variables disponibles (se reemplazan automáticamente):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs font-mono">
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{nombre}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{apellido}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{fecha}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{hora_inicio}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{hora_fin}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{profesional}'}</span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded">{'{servicio}'}</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-600">
                    Este es el mensaje completo que se enviará por WhatsApp. Si lo dejás vacío, se usa el mensaje predeterminado.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mensaje completo de WhatsApp
                </label>
                <button
                  type="button"
                  onClick={() => setWhatsappTemplateText(WHATSAPP_TEMPLATE_EJEMPLO)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Usar plantilla de ejemplo
                </button>
              </div>
              <textarea
                value={whatsappTemplateText}
                onChange={(e) => setWhatsappTemplateText(e.target.value)}
                rows={10}
                placeholder="Escribí el mensaje completo del recordatorio de WhatsApp..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none font-mono"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {whatsappTemplateChanged && (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Cambios sin guardar
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleSaveWhatsappTemplate}
                disabled={savingWhatsappTemplate}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {savingWhatsappTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar mensaje
                  </>
                )}
              </Button>
            </div>
            </>
            )}
          </div>
        </Card>
      )}

      {/* Date Selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#026498]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                setSelectedDate(tomorrow.toISOString().split('T')[0])
              }}
            >
              Mañana
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-48"
              />
            </div>

            <Button
              onClick={handleSendAll}
              disabled={sendingAll || turnosWithEmail.length === 0}
              className="bg-[#026498]"
            >
              {sendingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar a todos ({turnosWithEmail.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Date Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 capitalize">
          {formatDate(selectedDate)}
        </h3>
        <p className="text-sm text-gray-500">
          {filteredTurnos.length} turno{filteredTurnos.length !== 1 ? 's' : ''} encontrado{filteredTurnos.length !== 1 ? 's' : ''}
          {turnosWithoutEmail.length > 0 && (
            <span className="text-amber-600"> · {turnosWithoutEmail.length} sin email</span>
          )}
        </p>
      </div>

      {/* Mass result banner */}
      {massResult && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">
              Recordatorios enviados: {massResult.enviados} de {massResult.total}
              {massResult.errores > 0 && (
                <span className="text-red-600"> · {massResult.errores} con error</span>
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Turnos List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredTurnos.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-lg">No hay turnos para esta fecha</p>
            <p className="text-sm text-gray-400 mt-1">
              Seleccioná otra fecha para ver los turnos.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTurnos.map((turno) => {
            const isSent = sentIds.has(turno.id)
            const isSending = sendingId === turno.id
            const hasError = errorIds.has(turno.id)
            const hasEmail = !!turno.paciente?.email

            return (
              <Card key={turno.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {turno.paciente?.apellido}, {turno.paciente?.nombre}
                      </span>
                      {!hasEmail && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          Sin email
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {turno.hora_inicio} - {turno.hora_fin}
                      </span>
                      {turno.profesional && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {turno.profesional.nombre} {turno.profesional.apellido}
                        </span>
                      )}
                      {turno.servicio && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {turno.servicio.nombre}
                        </span>
                      )}
                    </div>
                    {hasEmail && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="h-3 w-3" />
                        {turno.paciente?.email}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Botón WhatsApp (Siempre disponible si hay teléfono) */}
                    {turno.paciente?.telefono && (
                      <div className="flex items-center gap-1 mr-2">
                        {turno.estado === 'Confirmado por Whatsapp' ? (
                          <span className="inline-flex items-center justify-center px-3 h-9 bg-green-100 border border-green-300 text-green-700 text-xs font-bold rounded-lg shadow-sm">
                            Confirmado por WA
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingWhatsAppTurno(turno)
                                setWhatsAppMessageText(formatWhatsAppMessage(turno, whatsappTemplateText))
                              }}
                              className="inline-flex items-center justify-center gap-2 px-3 h-9 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow hover:-translate-y-0.5 duration-150"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(turno.id, 'Confirmado por Whatsapp')}
                              className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs font-bold shadow-sm"
                            >
                              Confirmó
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(turno.id, 'Cancelado')}
                              className="bg-rose-600 hover:bg-rose-700 h-9 text-xs font-bold shadow-sm"
                            >
                              Canceló
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {hasEmail && !isSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(turno.id)}
                        title="Vista previa del email"
                        className="text-gray-500 h-9"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {!hasEmail ? (
                      <span className="text-xs text-gray-400 italic">Sin Email</span>
                    ) : isSent ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-5 w-5" />
                        Enviado
                      </div>
                    ) : hasError ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingEmailTurno(turno);
                            const initText = getInitialEmailText(turno, templateText);
                            setEmailMessageText(initText);
                            fetchEmailPreview(turno.id, initText);
                          }}
                          className="bg-red-600 hover:bg-red-700 h-9 text-xs"
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEmailTurno(turno);
                          const initText = getInitialEmailText(turno, templateText);
                          setEmailMessageText(initText);
                          fetchEmailPreview(turno.id, initText);
                        }}
                        disabled={isSending}
                        className="bg-[#026498] h-9 text-xs"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Email
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#026498]" />
                  Vista previa del email
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewTurnoId
                    ? 'Así se verá el email para este paciente'
                    : 'Ejemplo con datos de prueba'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setPreviewHtml('')
                  setPreviewTurnoId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="p-4">
                  <div
                    className="border rounded-lg overflow-hidden"
                    style={{ backgroundColor: '#f9f9f9' }}
                  >
                    <iframe
                      srcDoc={previewHtml}
                      title="Email Preview"
                      className="w-full border-0"
                      style={{ minHeight: '500px' }}
                      sandbox=""
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Los datos del turno (fecha, hora, profesional, servicio) siempre se incluyen automáticamente.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false)
                  setPreviewHtml('')
                  setPreviewTurnoId(null)
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
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
