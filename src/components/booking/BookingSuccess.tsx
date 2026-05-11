"use client"

import React from "react"
import { Link } from "react-router-dom"
import { Check, Calendar, User, Clock, ArrowRight, Printer } from "lucide-react"

interface BookingSuccessProps {
  appointmentData: {
    service: string
    professional: string
    dateTime: string
    patientName: string
    patientPhone: string
    patientEmail: string
    patientDni?: string
  }
  onNewBooking: () => void
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({ appointmentData, onNewBooking }) => {
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  const { date, time } = formatDateTime(appointmentData.dateTime)

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in zoom-in duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-[#10b981] text-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-900/20">
          <Check size={48} strokeWidth={4} />
        </div>
        
        <h2 className="text-4xl font-black text-[#10b981] mb-4">¡Turno Confirmado!</h2>
        <p className="text-gray-500 font-medium mb-12">
          Tu cita ha sido agendada con éxito. Podrás ver los detalles en tu panel de usuario.
        </p>

        <div className="bg-gray-50/50 rounded-[2.5rem] p-8 space-y-6 mb-12 text-left border border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#10b981]">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Fecha</p>
              <p className="font-black text-gray-900 capitalize">{date}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#10b981]">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Horario</p>
              <p className="font-black text-gray-900">{time} hs</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#10b981]">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Especialista</p>
              <p className="font-black text-gray-900">{appointmentData.professional}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            to="/paciente/dashboard"
            className="flex items-center justify-center gap-3 w-full bg-[#026498] text-white h-16 rounded-2xl font-black text-xl shadow-xl shadow-blue-900/10 hover:bg-[#0c4a6e] transition-all transform hover:-translate-y-1"
          >
            Ir a panel de usuario
            <ArrowRight size={20} />
          </Link>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={onNewBooking}
              className="h-14 px-6 rounded-2xl font-black text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all text-xs uppercase tracking-widest"
            >
              Nuevo turno
            </button>
            <button
              onClick={() => window.print()}
              className="h-14 px-6 rounded-2xl font-black text-[#026498] bg-blue-50/50 hover:bg-blue-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
