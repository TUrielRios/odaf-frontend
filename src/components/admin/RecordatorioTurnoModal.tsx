import React, { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import {
  Bell,
  Mail,
  Eye,
  Loader2,
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import { recordatoriosApi } from '../../api'
import type { Turno } from '../../types'
import { cleanPhone, formatWhatsAppMessage, getInitialEmailText } from '../../lib/recordatorio'

interface RecordatorioTurnoModalProps {
  turno: Turno
  onClose: () => void
  /** Se llama tras enviar el email o abrir el WhatsApp, por si el padre quiere refrescar. */
  onSent?: () => void
}

type Canal = 'email' | 'whatsapp'

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

/**
 * Modal para enviar y editar el recordatorio de un turno puntual.
 * Permite personalizar el mensaje (párrafo del email o texto de WhatsApp) antes
 * de enviarlo, con vista previa del email tal como lo recibirá el paciente.
 */
export const RecordatorioTurnoModal: React.FC<RecordatorioTurnoModalProps> = ({ turno, onClose, onSent }) => {
  const hasEmail = !!turno.paciente?.email
  const hasPhone = !!turno.paciente?.telefono

  const [canal, setCanal] = useState<Canal>(hasEmail ? 'email' : 'whatsapp')

  // Email
  const [emailMessageText, setEmailMessageText] = useState('')
  const [emailPreviewHtml, setEmailPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(false)

  // WhatsApp
  const [whatsAppMessageText, setWhatsAppMessageText] = useState('')

  const fetchEmailPreview = async (customMessage: string) => {
    try {
      setLoadingPreview(true)
      const result = await recordatoriosApi.preview({ turno_id: turno.id, custom_template: customMessage })
      setEmailPreviewHtml(result.html)
    } catch (error) {
      console.error('Error loading email preview:', error)
      setEmailPreviewHtml('<p style="color:red;text-align:center;padding:40px;">Error al cargar la vista previa</p>')
    } finally {
      setLoadingPreview(false)
    }
  }

  // Al abrir: carga el template guardado y precarga los mensajes de ambos canales.
  useEffect(() => {
    let active = true
    const init = async () => {
      let emailTemplate = ''
      let waTemplate = ''
      try {
        const [email, whatsapp] = await Promise.all([
          recordatoriosApi.obtenerTemplate('email'),
          recordatoriosApi.obtenerTemplate('whatsapp'),
        ])
        emailTemplate = email.template || ''
        waTemplate = whatsapp.template || ''
      } catch {
        // Sin templates guardados: se usan los mensajes predeterminados.
      }
      if (!active) return
      const emailText = getInitialEmailText(turno, emailTemplate)
      setEmailMessageText(emailText)
      setWhatsAppMessageText(formatWhatsAppMessage(turno, waTemplate))
      if (turno.paciente?.email) {
        fetchEmailPreview(emailText)
      }
    }
    init()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno.id])

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true)
      setEmailError(false)
      await recordatoriosApi.enviar(turno.id, emailMessageText)
      setEmailSent(true)
      onSent?.()
    } catch (error) {
      console.error('Error sending reminder:', error)
      setEmailError(true)
    } finally {
      setSendingEmail(false)
    }
  }

  const handleOpenWhatsApp = () => {
    const phone = cleanPhone(turno.paciente?.telefono)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessageText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onSent?.()
  }

  const pacienteNombre = `${turno.paciente?.nombre || ''} ${turno.paciente?.apellido || ''}`.trim()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.75rem] shadow-2xl w-[95%] max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-blue-50 rounded-xl">
              <Bell className="h-5 w-5 text-[#026498]" />
            </span>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Enviar Recordatorio</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                Paciente: <span className="font-bold text-gray-700">{pacienteNombre || 'Sin nombre'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Selector de canal */}
        <div className="px-6 pt-4">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setCanal('email')}
              disabled={!hasEmail}
              className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                canal === 'email' ? 'bg-white text-[#026498] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              } ${!hasEmail ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setCanal('whatsapp')}
              disabled={!hasPhone}
              className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                canal === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              } ${!hasPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <WhatsAppIcon className="h-4 w-4 fill-current" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {canal === 'email' ? (
            !hasEmail ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
                <p className="text-sm font-bold text-gray-700">El paciente no tiene email registrado</p>
                <p className="text-xs text-gray-400 mt-1">Podés enviarle el recordatorio por WhatsApp.</p>
              </div>
            ) : emailSent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="h-14 w-14 text-emerald-500 mb-3" />
                <p className="text-base font-black text-gray-800">Recordatorio enviado</p>
                <p className="text-xs text-gray-400 mt-1 break-all">{turno.paciente?.email}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <div className="flex items-start gap-2 mb-3 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Editá el texto del mensaje. Los datos del turno (fecha, hora, profesional y servicio) se agregan
                      automáticamente.
                    </p>
                  </div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Texto del mensaje (párrafo del correo)
                  </label>
                  <textarea
                    value={emailMessageText}
                    onChange={(e) => setEmailMessageText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none resize-none flex-1"
                    placeholder="Escribí el párrafo del recordatorio..."
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchEmailPreview(emailMessageText)}
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Actualizar vista previa
                        </>
                      )}
                    </Button>
                  </div>
                  {emailError && (
                    <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      No se pudo enviar el email. Intentá de nuevo.
                    </p>
                  )}
                </div>

                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Vista previa</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                      Así se enviará
                    </span>
                  </div>
                  <div className="flex-1 bg-white p-2 min-h-[300px]">
                    {loadingPreview ? (
                      <div className="flex items-center justify-center h-full min-h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <iframe
                        srcDoc={emailPreviewHtml}
                        title="Vista previa del email"
                        className="w-full h-full min-h-[300px] border-0"
                        sandbox=""
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          ) : !hasPhone ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
              <p className="text-sm font-bold text-gray-700">El paciente no tiene teléfono registrado</p>
              <p className="text-xs text-gray-400 mt-1">Podés enviarle el recordatorio por email.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-2 mb-3 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Editá el mensaje si querés. Al enviarlo se abre WhatsApp con el texto listo para el número{' '}
                  <span className="font-bold">{turno.paciente?.telefono}</span>.
                </p>
              </div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mensaje de WhatsApp
              </label>
              <textarea
                value={whatsAppMessageText}
                onChange={(e) => setWhatsAppMessageText(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none resize-none font-mono"
                placeholder="Escribí el mensaje..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end items-center gap-3">
          <Button variant="outline" onClick={onClose} className="h-10 text-sm font-medium">
            {emailSent ? 'Cerrar' : 'Cancelar'}
          </Button>

          {canal === 'email' && hasEmail && !emailSent && (
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailMessageText.trim()}
              className="bg-[#026498] hover:bg-[#0c4a6e] text-white h-10 px-5 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          )}

          {canal === 'whatsapp' && hasPhone && (
            <Button
              onClick={handleOpenWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white h-10 px-5 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <WhatsAppIcon className="h-4 w-4 fill-current" />
              Abrir WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
