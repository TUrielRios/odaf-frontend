"use client"

import React from "react"
import { Servicio, Profesional, CrearPacienteData } from "../../types"
import {
  Info,
  Clock,
  User,
  Calendar,
  ShieldCheck,
  BellRing
} from "lucide-react"

interface PaymentStepProps {
  service: Servicio
  professional: Profesional
  dateTime: string
  patientData: CrearPacienteData
  loading: boolean
  onConfirm: () => void
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

        {/* Confirmation Card */}
        <div className="space-y-6 sm:space-y-8">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <ShieldCheck className="text-[#026498]" size={20} />
            Confirmar Reserva
          </h3>

          <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border-2 border-[#026498]/10 space-y-6 sm:space-y-8 shadow-xl shadow-blue-900/5">
            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-gray-50">
              <div className="w-16 h-16 rounded-full bg-[#026498]/10 text-[#026498] flex items-center justify-center">
                <ShieldCheck size={32} />
              </div>
              <div>
                <span className="text-[#026498] font-black text-xs uppercase tracking-widest block mb-1">Cita sin seña previa</span>
                <h4 className="text-lg sm:text-xl font-black text-gray-900">Estás a un paso de reservar</h4>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-500/10">
                <BellRing className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                  Tu reserva se agendará y <strong>confirmará de inmediato</strong>. Te enviaremos los detalles y confirmación al instante por WhatsApp y Email.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                <Info className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
                  No se requiere realizar ningún pago ni transferencia para completar este paso.
                </p>
              </div>
            </div>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full h-16 sm:h-20 bg-[#026498] text-white font-black rounded-3xl sm:rounded-[2.5rem] text-lg sm:text-xl shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-1 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "Confirmando..." : "Confirmar Turno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
