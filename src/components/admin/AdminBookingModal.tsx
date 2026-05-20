"use client"

import React, { useState } from "react"
import { X, Check, Stethoscope, User, Calendar, FileText, ArrowLeft } from "lucide-react"
import { Button } from "../ui/Button"
import { ServiceSelection } from "../booking/ServiceSelection"
import { ProfessionalSelection } from "../booking/ProfessionalSelection"
import { DateTimeSelection } from "../booking/DateTimeSelection"
import { PatientForm } from "../booking/PatientForm"
import type { Servicio, Profesional, CrearPacienteData } from "../../types"
import { turnosApi, pacientesApi } from "../../api"

interface AdminBookingModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [patientType, setPatientType] = useState<"existing" | "new" | null>(null)
  const [searchPaciente, setSearchPaciente] = useState("")
  const [pacientes, setPacientes] = useState<any[]>([])
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    const searchPatients = async () => {
      if (searchPaciente.length > 2) {
        try {
          const response = await pacientesApi.listar({ search: searchPaciente, limit: 10 })
          setPacientes(response.data)
        } catch (error) {
          console.error("Error searching patients:", error)
        }
      } else {
        setPacientes([])
      }
    }
    const timer = setTimeout(searchPatients, 300)
    return () => clearTimeout(timer)
  }, [searchPaciente])

  const handleServiceSelect = (service: Servicio) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleProfessionalSelect = (professional: Profesional) => {
    setSelectedProfessional(professional)
    setStep(3)
  }

  const handleDateTimeSelect = (dateTime: string) => {
    setSelectedDateTime(dateTime)
    setStep(4)
    setPatientType(null)
  }

  const createTurno = async (pacienteId: string) => {
    if (!selectedService || !selectedProfessional || !selectedDateTime) return

    setLoading(true)
    try {
      const horaInicio = selectedDateTime.split('T')[1].substring(0, 5)
      const [hours, minutes] = horaInicio.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + (selectedService.duracion_estimada || 30)
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const horaFin = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

      await turnosApi.crear({
        paciente_id: pacienteId,
        profesional_id: selectedProfessional.id,
        servicio_id: selectedService.id,
        fecha: selectedDateTime.split('T')[0],
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "Creado",
        pago_confirmado: false,
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating appointment:", error)
      alert("Error al crear el turno. Por favor, verifique los datos e intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handlePatientSubmit = async (data: CrearPacienteData) => {
    try {
      setLoading(true)
      let pacienteId: string

      // Try to find existing patient by DNI
      let existingPatient = null
      try {
        existingPatient = await pacientesApi.buscarPorDocumento(data.numero_documento)
      } catch (e) {
        // Patient not found - this is expected for new patients
        existingPatient = null
      }
      
      if (existingPatient) {
        pacienteId = existingPatient.id
      } else {
        // Create new patient - ensure required fields have defaults
        const patientData = {
          ...data,
          condicion: data.condicion || 'Activo',
          tipo_facturacion: data.tipo_facturacion || 'B',
        }
        const newPatient = await pacientesApi.crear(patientData)
        pacienteId = newPatient.id
      }
      await createTurno(pacienteId)
    } catch (error: any) {
      console.error("Error handling patient:", error)
      const msg = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.msg || error?.message || "Error al procesar los datos del paciente."
      alert(msg)
      setLoading(false)
    }
  }

  const progressSteps = [
    { id: 1, name: "Servicio", icon: Stethoscope },
    { id: 2, name: "Profesional", icon: User },
    { id: 3, name: "Fecha", icon: Calendar },
    { id: 4, name: "Paciente", icon: FileText },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#026498] flex items-center justify-center font-black text-lg">
              {step}
            </div>
            <div>
              <h3 className="text-xl font-black text-[#026498] tracking-tight">
                {step === 1 && "Seleccionar Servicio"}
                {step === 2 && "Seleccionar Profesional"}
                {step === 3 && "Seleccionar Fecha y Hora"}
                {step === 4 && "Datos del Paciente"}
              </h3>
              <p className="text-sm text-gray-400 font-medium">Paso {step} de 4</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center justify-between relative mb-12 px-4">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#026498] transition-all duration-500" 
                style={{ width: `${((step - 1) / (progressSteps.length - 1)) * 100}%` }}
              ></div>

              {progressSteps.map((s) => {
                const Icon = s.icon
                const isCompleted = step > s.id
                const isActive = step === s.id
                return (
                  <div key={s.id} className="relative z-10 flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted ? "bg-[#026498] text-white" : isActive ? "bg-white border-2 border-[#026498] text-[#026498] shadow-lg scale-110" : "bg-white border-2 border-gray-100 text-gray-300"}
                    `}>
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                    </div>
                    <span className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? "text-[#026498]" : "text-gray-300"}`}>
                      {s.name}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Back Button */}
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all mb-8 group"
              >
                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50">
                  <ArrowLeft size={12} strokeWidth={3} />
                </div>
                Volver
              </button>
            )}

            {/* Step Views */}
            <div className="min-h-[400px]">
              {step === 1 && (
                <ServiceSelection 
                  onServiceSelect={handleServiceSelect} 
                  selectedService={selectedService} 
                />
              )}
              {step === 2 && (
                <ProfessionalSelection
                  selectedService={selectedService}
                  onProfessionalSelect={handleProfessionalSelect}
                  selectedProfessional={selectedProfessional}
                />
              )}
              {step === 3 && selectedProfessional && (
                <DateTimeSelection
                  selectedService={selectedService}
                  selectedProfessional={selectedProfessional}
                  onDateTimeSelect={handleDateTimeSelect}
                  selectedDateTime={selectedDateTime}
                  isAdmin={true}
                />
              )}
              {step === 4 && (
                <div className="space-y-8">
                   {!patientType ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <button
                          onClick={() => setPatientType("existing")}
                          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#026498] hover:bg-blue-50 transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#026498] mb-4 group-hover:bg-[#026498] group-hover:text-white transition-all">
                            <User size={32} />
                          </div>
                          <span className="text-lg font-black text-gray-900">Paciente Existente</span>
                          <p className="text-sm text-gray-400 text-center mt-2">Buscar en la base de datos</p>
                        </button>

                        <button
                          onClick={() => setPatientType("new")}
                          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-[#026498] hover:bg-blue-50 transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#026498] mb-4 group-hover:bg-[#026498] group-hover:text-white transition-all">
                            <Check size={32} />
                          </div>
                          <span className="text-lg font-black text-gray-900">Nuevo Paciente</span>
                          <p className="text-sm text-gray-400 text-center mt-2">Registrar datos por primera vez</p>
                        </button>
                     </div>
                   ) : patientType === "existing" ? (
                     <div className="max-w-xl mx-auto space-y-6">
                        <div className="relative">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Buscar Paciente</label>
                          <input
                            type="text"
                            placeholder="Buscar por DNI, nombre o apellido..."
                            value={searchPaciente}
                            onChange={(e) => {
                              setSearchPaciente(e.target.value)
                              setSelectedPacienteId(null)
                            }}
                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-bold text-lg"
                          />
                          
                          {searchPaciente.length > 2 && !selectedPacienteId && (
                            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                              {pacientes.length > 0 ? pacientes.map((p) => (
                                <div
                                  key={p.id}
                                  className="px-6 py-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                                  onClick={() => {
                                    setSelectedPacienteId(p.id)
                                    setSearchPaciente(`${p.apellido}, ${p.nombre} (DNI: ${p.numero_documento})`)
                                  }}
                                >
                                  <div className="font-bold text-gray-900">{p.apellido}, {p.nombre}</div>
                                  <div className="text-sm text-gray-500">DNI: {p.numero_documento}</div>
                                </div>
                              )) : (
                                <div className="p-6 text-center text-gray-400 font-medium">No se encontraron resultados</div>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedPacienteId && (
                          <div className="bg-green-50 border border-green-100 rounded-3xl p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                             <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mb-4">
                               <Check size={32} strokeWidth={3} />
                             </div>
                             <h4 className="text-xl font-black text-gray-900">Paciente Seleccionado</h4>
                             <p className="text-green-700 font-bold mt-1 text-center">{searchPaciente}</p>
                             
                             <Button
                              className="mt-8 w-full bg-[#026498] hover:bg-[#0c4a6e]"
                              onClick={() => createTurno(selectedPacienteId)}
                              loading={loading}
                             >
                               Confirmar Agendamiento
                             </Button>
                             <button 
                               onClick={() => {setSelectedPacienteId(null); setSearchPaciente("")}}
                               className="mt-4 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
                             >
                               Cambiar paciente
                             </button>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setPatientType(null)}
                          className="w-full py-4 text-sm font-black text-[#026498] uppercase tracking-widest hover:underline"
                        >
                          Volver a elegir tipo
                        </button>
                     </div>
                   ) : (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center px-4">
                           <h4 className="text-lg font-black text-gray-900">Registro de Nuevo Paciente</h4>
                           <button 
                             onClick={() => setPatientType(null)}
                             className="text-sm font-bold text-[#026498] hover:underline"
                           >
                             Cambiar a paciente existente
                           </button>
                        </div>
                        <PatientForm
                          onPatientData={handlePatientSubmit}
                          loading={loading}
                          submitButtonText="Agendar Turno"
                        />
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        {(selectedService || selectedProfessional || selectedDateTime) && (
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-6 items-center justify-center text-xs">
            {selectedService && (
              <div className="flex items-center gap-2">
                <Stethoscope size={14} className="text-gray-400" />
                <span className="font-bold text-gray-700">{selectedService.nombre}</span>
              </div>
            )}
            {selectedProfessional && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="font-bold text-gray-700">{selectedProfessional.nombre} {selectedProfessional.apellido}</span>
              </div>
            )}
            {selectedDateTime && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="font-bold text-gray-700">
                  {new Date(selectedDateTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} a las {selectedDateTime.split('T')[1].substring(0, 5)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
