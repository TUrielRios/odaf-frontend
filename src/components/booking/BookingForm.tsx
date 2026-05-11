"use client"

import React, { useState, useEffect } from "react"
import { ServiceSelection } from "./ServiceSelection"
import { ProfessionalSelection } from "./ProfessionalSelection"
import { DateTimeSelection } from "./DateTimeSelection"
import { PatientForm } from "./PatientForm"
import { PaymentStep } from "./PaymentStep"
import { BookingSuccess } from "./BookingSuccess"
import { BookingSummary } from "./BookingSummary"
import type { Servicio, Profesional, CrearPacienteData } from "../../types"
import { turnosApi, pacientesApi } from "../../api"
import { patientPortalApi, getPatientToken } from "../../api/patient-portal"
import { 
  Check,
  Stethoscope,
  User,
  Calendar,
  FileText,
  CreditCard,
  ArrowLeft
} from "lucide-react"

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<CrearPacienteData | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mesActualBloqueado, setMesActualBloqueado] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = getPatientToken()
      if (token) {
        try {
          const perfil = await patientPortalApi.obtenerPerfil()
          if (perfil.paciente) {
            setIsAuthenticated(true)
            const paciente = perfil.paciente
            setPatientData({
              nombre: paciente.nombre,
              apellido: paciente.apellido,
              tipo_documento: paciente.tipo_documento as "DNI" | "Pasaporte" | "Cédula",
              numero_documento: paciente.numero_documento,
              fecha_nacimiento: paciente.fecha_nacimiento,
              sexo: paciente.sexo as "Masculino" | "Femenino" | "Otro",
              email: paciente.email,
              telefono: paciente.telefono,
              direccion: paciente.direccion || "",
              observaciones: "",
            })
            
            const turnos = await patientPortalApi.obtenerMisTurnos()
            const today = new Date()
            const currentMonth = today.getMonth()
            const currentYear = today.getFullYear()
            const tieneTurnoEsteMes = turnos.some((t: any) => {
              const fechaTurno = new Date(t.fecha)
              return fechaTurno.getMonth() === currentMonth && 
                     fechaTurno.getFullYear() === currentYear &&
                     t.estado !== 'Cancelado'
            })
            setMesActualBloqueado(tieneTurnoEsteMes)
          }
        } catch (e) {
          console.error("Error al obtener perfil:", e)
          localStorage.removeItem("patientToken")
          setIsAuthenticated(false)
        }
      }
    }
    checkAuth()
  }, [])

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
    if (isAuthenticated && patientData) {
      setStep(5)
    } else {
      setStep(4)
    }
  }

  const handlePatientSubmit = (data: CrearPacienteData) => {
    setPatientData(data)
    setStep(5)
  }

  const handleFinalSubmit = async () => {
    if (!selectedService || !selectedProfessional || !selectedDateTime || !patientData) return

    setLoading(true)
    try {
      let pacienteId: string
      const existingPatient = await pacientesApi.buscarPorDocumento(patientData.numero_documento)

      if (existingPatient) {
        pacienteId = existingPatient.id
      } else {
        const newPatient = await pacientesApi.crear(patientData)
        pacienteId = newPatient.id
      }

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
        estado: "Confirmado",
        pago_confirmado: false,
      })

      setBookingSuccess(true)
    } catch (error: any) {
      console.error("Error creating appointment:", error)
      alert("Error al crear el turno. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const resetBooking = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedProfessional(null)
    setSelectedDateTime(null)
    setBookingSuccess(false)
  }

  if (bookingSuccess && selectedService && selectedProfessional && selectedDateTime) {
    return (
      <BookingSuccess
        appointmentData={{
          service: selectedService.nombre,
          professional: `${selectedProfessional.nombre} ${selectedProfessional.apellido}`,
          dateTime: selectedDateTime,
          patientName: patientData ? `${patientData.nombre} ${patientData.apellido}` : "",
          patientPhone: patientData?.telefono || "",
          patientEmail: patientData?.email || "",
          patientDni: patientData?.numero_documento || "",
        }}
        onNewBooking={resetBooking}
      />
    )
  }

  const progressSteps = [
    { id: 1, name: "SERVICIO", icon: Stethoscope },
    { id: 2, name: "PROFESIONAL", icon: User },
    { id: 3, name: "FECHA", icon: Calendar },
    { id: 4, name: "DATOS", icon: FileText },
    { id: 5, name: "PAGO", icon: CreditCard }
  ]

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-[#026498]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Back Button */}
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-400 hover:text-[#026498] font-black text-[10px] uppercase tracking-widest transition-all mb-6 group px-2 sm:px-0"
              >
                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <ArrowLeft size={12} strokeWidth={3} />
                </div>
                Volver
              </button>
            )}
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-[#026498] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-blue-900/20">
                  {step}
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-[#026498] leading-tight">
                    {step === 1 && "Selecciona el servicio"}
                    {step === 2 && "Elige tu profesional"}
                    {step === 3 && "Elige la fecha y hora"}
                    {step === 4 && "Tus datos personales"}
                    {step === 5 && "Confirma y paga tu seña"}
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-tight">
                    {step === 1 && "Elige el tratamiento que necesitas."}
                    {step === 2 && "Selecciona el especialista que te atenderá."}
                    {step === 3 && "Selecciona el día y horario que prefieras."}
                    {step === 4 && "Completa el formulario para confirmar tu turno."}
                    {step === 5 && "Tu lugar quedará reservado una vez confirmes."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
              {/* Progress Indicator */}
              <div className="px-4 sm:px-12 py-6 sm:py-10 border-b border-gray-50">
                <div className="flex items-center justify-between relative max-w-md mx-auto sm:max-w-none">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#026498] transition-all duration-700" 
                    style={{ width: `${((step - 1) / (progressSteps.length - 1)) * 100}%` }}
                  ></div>

                  {progressSteps.map((s) => {
                    const Icon = s.icon
                    const isCompleted = step > s.id
                    const isActive = step === s.id
                    const isAccessible = s.id < step

                    return (
                      <div 
                        key={s.id} 
                        className={`relative z-10 flex flex-col items-center ${isAccessible ? 'cursor-pointer group' : ''}`}
                        onClick={() => { if (isAccessible) setStep(s.id) }}
                      >
                        <div className={`
                          w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500
                          ${isCompleted ? "bg-[#026498] text-white" : isActive ? "bg-white border-2 border-[#026498] text-[#026498] shadow-lg scale-110" : "bg-white border-2 border-gray-100 text-gray-300"}
                          ${isAccessible ? "group-hover:scale-110 group-hover:shadow-md" : ""}
                        `}>
                          {isCompleted ? <Check size={14} strokeWidth={3} className="sm:w-5 sm:h-5" /> : <Icon size={14} className="sm:w-5 sm:h-5" />}
                        </div>
                        {/* Labels removed as per request to avoid redundancy with the main header title */}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="p-6 sm:p-12 min-h-[400px] sm:min-h-[500px]">
                {step === 1 && <ServiceSelection onServiceSelect={handleServiceSelect} selectedService={selectedService} />}
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
                    mesActualBloqueado={mesActualBloqueado}
                  />
                )}
                {step === 4 && (
                  <PatientForm
                    onPatientData={handlePatientSubmit}
                    loading={loading}
                  />
                )}
                {step === 5 && selectedService && selectedProfessional && selectedDateTime && patientData && (
                  <PaymentStep
                    service={selectedService}
                    professional={selectedProfessional}
                    dateTime={selectedDateTime}
                    patientData={patientData}
                    loading={loading}
                    onConfirm={handleFinalSubmit}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <BookingSummary
              service={selectedService}
              professional={selectedProfessional}
              dateTime={selectedDateTime}
              patientData={patientData}
              step={step}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  )
}