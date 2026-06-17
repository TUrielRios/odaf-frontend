"use client"

import React, { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { turnosApi } from "../../api"
import type { Turno } from "../../types"
import { Calendar, Clock, User, Stethoscope, AlertCircle, Pencil } from "lucide-react"
import { EditAppointmentModal } from "../admin/EditAppointmentModal"

interface PatientAppointmentsSectionProps {
  pacienteId: string
}

export const TurnosSection: React.FC<PatientAppointmentsSectionProps> = ({ pacienteId }) => {
  const [appointments, setAppointments] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [pacienteId])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await turnosApi.listar({ 
        paciente_id: pacienteId,
        limit: 100 
      })
      // The API returns { data: [...], pagination: {...} }
      const sorted = (response?.data || []).sort((a: Turno, b: Turno) => {
        const dateA = new Date(`${a.fecha}T${a.hora_inicio}`)
        const dateB = new Date(`${b.fecha}T${b.hora_inicio}`)
        return dateB.getTime() - dateA.getTime() // Newest first
      })
      setAppointments(sorted)
    } catch (error) {
      console.error("Error fetching patient appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyles = (estado: string) => {
    const styles: Record<string, string> = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Confirmado': 'bg-green-100 text-green-800 border-green-200',
      'Atendido': 'bg-blue-100 text-blue-800 border-blue-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200',
      'Ausente': 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return styles[estado] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#026498]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Historial de Turnos</h3>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {appointments.length} {appointments.length === 1 ? 'Turno' : 'Turnos'} en total
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200 bg-gray-50/30">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">No hay historial de turnos para este paciente</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((turno) => (
            <Card key={turno.id} className="overflow-hidden border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: getStatusStyles(turno.estado).split(' ')[1].replace('text-', '') }}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(turno.estado)}`}>
                      {turno.estado}
                    </span>
                    <div className="flex items-center text-gray-400">
                       <Calendar className="h-3.5 w-3.5 mr-1" />
                       <span className="text-xs font-bold">{new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-[#026498]" />
                      <span className="text-sm font-black">{turno.hora_inicio.substring(0, 5)} - {turno.hora_fin.substring(0, 5)} hs</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Stethoscope className="h-4 w-4 mr-2 text-[#026498]" />
                      <span className="text-sm font-bold">{turno.servicio?.nombre || 'Servicio no especificado'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2 text-[#026498]" />
                      <span className="text-sm font-bold">Prof: {turno.profesional?.nombre} {turno.profesional?.apellido}</span>
                    </div>
                  </div>
                </div>

                {turno.observaciones && (
                  <div className="md:max-w-xs w-full bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                    <div className="flex items-start gap-2">
                       <AlertCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                       <p className="text-xs text-blue-800 leading-relaxed italic">"{turno.observaciones}"</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end md:justify-center">
                  <button
                    onClick={() => setSelectedTurno(turno)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#026498] hover:border-[#026498]/30 transition-all active:scale-95"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#026498]" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTurno && (
        <EditAppointmentModal
          appointment={selectedTurno}
          onClose={() => setSelectedTurno(null)}
          onUpdate={fetchAppointments}
        />
      )}
    </div>
  )
}
