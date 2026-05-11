"use client"

import React from "react"
import { Servicio, Profesional, CrearPacienteData } from "../../types"
import { 
  Building2, 
  Info,
  Clock,
  User,
  Calendar,
  Wallet,
  Phone
} from "lucide-react"
import { WhatsAppIcon } from "./DentalIcons"

interface PaymentStepProps {
  service: Servicio
  professional: Profesional
  dateTime: string
  patientData: CrearPacienteData
  loading: boolean
  onConfirm: () => void
}

const PAYMENT_INFO = {
  amount: 5000,
  cbu: "3840200500000002363134",
  alias: "Odafodonto",
  titular: "Adriana Franzil",
  banco: "Ualá Bank S.A.U.",
  whatsapp: "5491140483693"
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  service,
  professional,
  dateTime,
  patientData,
  loading,
  onConfirm
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Reservation Summary */}
        <div className="space-y-8">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <Info className="text-[#026498]" size={20} />
            Resumen de reserva
          </h3>
          
          <div className="space-y-6 bg-gray-50/50 p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-gray-50">
            {[
              { icon: Clock, label: "Tratamiento", value: service.nombre, sub: `${service.duracion_estimada} min` },
              { icon: User, label: "Profesional", value: `${professional.nombre} ${professional.apellido}`, sub: professional.especialidad },
              { icon: Calendar, label: "Fecha y Hora", value: formatDate(dateTime), sub: `${formatTime(dateTime)} hs`, accent: true },
              { icon: User, label: "Paciente", value: `${patientData.nombre} ${patientData.apellido}`, sub: `DNI: ${patientData.numero_documento}` }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#026498] flex-shrink-0">
                  <item.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">{item.label}</p>
                  <p className={`font-black text-xs sm:text-sm ${item.accent ? 'text-[#026498]' : 'text-gray-900'} capitalize leading-tight`}>{item.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Data */}
        <div className="space-y-6 sm:space-y-8">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Wallet className="text-[#026498]" size={20} />
            Pago de Seña
          </h3>

          <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border-2 border-[#026498]/10 space-y-4 sm:space-y-6 shadow-xl shadow-blue-900/5">
            <div className="flex flex-col items-center text-center space-y-2 pb-6 border-b border-gray-50">
              <span className="text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest">Monto a abonar</span>
              <span className="text-3xl sm:text-4xl font-black text-[#026498]">${PAYMENT_INFO.amount}</span>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium max-w-[200px]">Transferencia para confirmar tu turno en el sistema.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Titular</span>
                <span className="text-[11px] sm:text-xs font-black text-gray-900">{PAYMENT_INFO.titular}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Banco</span>
                <span className="text-[11px] sm:text-xs font-black text-gray-900">{PAYMENT_INFO.banco}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Alias</span>
                <span className="text-[11px] sm:text-xs font-black text-gray-900">{PAYMENT_INFO.alias}</span>
              </div>
              <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">CBU</span>
                <span className="text-[10px] sm:text-[11px] font-black text-gray-900 tracking-wider">{PAYMENT_INFO.cbu}</span>
              </div>
            </div>

            <a 
              href={`https://wa.me/${PAYMENT_INFO.whatsapp}?text=${encodeURIComponent(`Hola! Envío comprobante de seña para mi turno de ${service.nombre} el día ${formatDate(dateTime)} a las ${formatTime(dateTime)}hs.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-4 sm:p-5 bg-[#25D366]/10 text-[#128C7E] rounded-2xl border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all font-black uppercase tracking-widest text-[9px] sm:text-[10px]"
            >
              <div className="p-2 bg-[#25D366] text-white rounded-lg flex-shrink-0">
                <WhatsAppIcon size={14} />
              </div>
              <span>Enviar Comprobante</span>
            </a>
          </div>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-16 sm:h-20 bg-[#026498] text-white font-black rounded-3xl sm:rounded-[2.5rem] text-lg sm:text-xl shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-1 uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Confirmando..." : "Confirmar Turno"}
          </button>
        </div>
      </div>
    </div>
  )
}
