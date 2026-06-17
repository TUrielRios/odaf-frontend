"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Profesional, Servicio } from "../../types"
import { profesionalesApi } from "../../api/profesionales"
import { feriadosApi } from "../../api/feriados"
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react"

interface DateTimeSelectionProps {
  selectedService: Servicio | null
  selectedProfessional: Profesional | null
  selectedDateTime: string | null
  onDateTimeSelect: (dateTime: string) => void
  mesActualBloqueado?: boolean
  isAdmin?: boolean
}

export const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  selectedService: _selectedService,
  selectedProfessional,
  selectedDateTime,
  onDateTimeSelect,
  mesActualBloqueado = false,
  isAdmin = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [professionalSchedule, setProfessionalSchedule] = useState<any>(null)
  const [holidays, setHolidays] = useState<string[]>([])
  const [viewDate, setViewDate] = useState(new Date())

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await feriadosApi.listar()
        const holidayDates = response.map(f => f.fecha.split('T')[0])
        setHolidays(holidayDates)
      } catch (e) {
        console.error('Error loading holidays:', e)
      }
    }
    loadHolidays()
  }, [])

  useEffect(() => {
    const loadProfessionalSchedule = async () => {
      if (!selectedProfessional) return
      try {
        const response = await profesionalesApi.obtenerHorarios(selectedProfessional.id)
        if (response.horarios) setProfessionalSchedule(response.horarios)
      } catch (error) {
        console.error('Error loading schedule:', error)
      }
    }
    loadProfessionalSchedule()
  }, [selectedProfessional])

  const isDayAvailable = (dateString: string): boolean => {
    if (holidays.includes(dateString)) return false
    const date = new Date(dateString + "T00:00:00")
    const today = new Date()
    today.setHours(0,0,0,0)
    if (date < today) return false

    // Si el mes actual está bloqueado (ya tiene turno), deshabilitar fechas de este mes
    if (mesActualBloqueado) {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return false
      }
    }

    if (professionalSchedule && professionalSchedule.dias_especificos && professionalSchedule.dias_especificos[dateString]) {
      return professionalSchedule.dias_especificos[dateString].activo
    }

    const dayOfWeek = date.getDay()
    if (!professionalSchedule) return dayOfWeek !== 0
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    const daySchedule = professionalSchedule[dayNames[dayOfWeek]]
    if (!daySchedule || !daySchedule.activo) return false

    if (daySchedule.frecuencia === "quincenal") {
      const refDate = new Date("2024-01-01T00:00:00")
      const diffInWeeks = Math.floor((date.getTime() - refDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (Math.abs(diffInWeeks % 2) !== (daySchedule.semana_inicio || 0)) return false
    }
    return true
  }

  useEffect(() => {
    if (selectedDate && selectedProfessional) checkAvailability()
  }, [selectedDate, selectedProfessional])

  const checkAvailability = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await profesionalesApi.obtenerHorariosDisponibles(selectedProfessional!.id, selectedDate, isAdmin)
      if (response.disponible && response.horarios_disponibles) setAvailableSlots(response.horarios_disponibles)
      else setError(response.mensaje || "No hay horarios disponibles")
    } catch (e) {
      setError("Error al cargar horarios")
    } finally {
      setLoading(false)
    }
  }

  const renderCalendar = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Adjust firstDay (0 for Sunday)
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h4 className="font-black text-gray-900 capitalize">
            {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h4>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-300 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const available = isDayAvailable(dateStr)
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={i}
                disabled={!available}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                  ${isSelected ? "bg-[#026498] text-white shadow-lg scale-110" : available ? "text-gray-700 hover:bg-blue-50 hover:text-[#026498]" : "text-gray-200 cursor-not-allowed"}
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        
        {/* Time Slots Column - On mobile, if date is selected, it goes FIRST */}
        <div className={`space-y-6 w-full ${selectedDate ? 'order-1 md:order-2' : 'order-2 md:order-2'}`}>
          <h3 className="font-black text-gray-900 flex items-center gap-3">
            <Clock className="text-[#026498]" size={20} />
            Horarios disponibles
          </h3>
          
          {selectedDate ? (
            <div className="animate-in slide-in-from-top-4 duration-500">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold text-xs">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {availableSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => onDateTimeSelect(`${selectedDate}T${time}:00`)}
                      className={`
                        py-4 rounded-xl font-bold transition-all border-2 text-sm
                        ${selectedDateTime?.includes(time) ? "bg-[#026498] text-white border-[#026498] shadow-lg" : "bg-white text-gray-600 border-gray-100 hover:border-blue-100 hover:text-[#026498]"}
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 sm:p-12 text-center bg-gray-50 rounded-3xl sm:rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <Clock className="mx-auto text-gray-200 mb-4" size={32} />
              <p className="text-gray-400 font-bold text-xs">Selecciona una fecha para ver horarios</p>
            </div>
          )}
        </div>

        {/* Calendar Column - On mobile, if date is selected, it goes SECOND */}
        <div className={`w-full ${selectedDate ? 'order-2 md:order-1' : 'order-1 md:order-1'}`}>
          <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-gray-50 shadow-sm transition-all duration-500">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <CalendarIcon className="text-[#026498]" size={20} />
              <h3 className="font-black text-gray-900">Fecha del turno</h3>
            </div>
            {renderCalendar()}
            
            {mesActualBloqueado && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold leading-tight">
                  Ya posees un turno en el mes actual. Solo puedes reservar para los próximos meses.
                </p>
              </div>
            )}

            {selectedDate && (
              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Fecha seleccionada</p>
                  <p className="text-sm font-black text-[#026498] capitalize">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedDate("")}
                  className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
