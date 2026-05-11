import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { dentalColors } from '../../config/colors'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Briefcase,
  Phone,
  Mail,
  List,
  LayoutGrid,
  Plus,
  Search,
} from 'lucide-react'
import { turnosApi } from '../../api'
import type { Turno, Profesional } from '../../types'
import { EditAppointmentModal } from './EditAppointmentModal'
import { AdminAppointmentModal } from './AdminAppointmentModal'
import { AdminBookingModal } from './AdminBookingModal'
import { profesionalesApi } from '../../api/profesionales'

type ViewType = 'day' | 'week' | 'month'

// Status colors mapping
const STATUS_COLORS = {
  'Pendiente': '#F59E0B', // Amber
  'Creado': '#3B82F6', // Blue
  'Esperando confirmación': '#EAB308', // Yellow
  'Confirmado por email': '#22C55E', // Green
  'Confirmado por SMS': '#22C55E', // Green
  'Confirmado por Whatsapp': '#22C55E', // Green
  'Confirmado': '#22C55E', // Green
  'En sala de espera': '#A855F7', // Purple
  'Atendiéndose': '#EC4899', // Pink
  'Atendido': '#06B6D4', // Cyan
  'Cancelado': '#EF4444', // Red
  'Ausente': '#000000', // Black
} as const

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Turno[]>([])
  const [professionals, setProfessionals] = useState<Profesional[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null)

  const [selectedAppointment, setSelectedAppointment] = useState<Turno | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('month')
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Turno[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [newAppointmentData, setNewAppointmentData] = useState<{ fecha: string, hora_inicio: string, sobre_turno: boolean } | null>(null)
  const [draggingAppointment, setDraggingAppointment] = useState<Turno | null>(null)

  const TIME_SLOTS = []
  for (let h = 8; h <= 20; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
  }

  useEffect(() => {
    fetchAppointments()
    fetchProfessionals()
  }, [currentDate, viewType])

  // Patient search
  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    const term = patientSearch.toLowerCase()
    const results = appointments.filter((t) => {
      const name = `${t.paciente?.apellido || ''} ${t.paciente?.nombre || ''}`.toLowerCase()
      const dni = t.paciente?.numero_documento || ''
      return name.includes(term) || dni.includes(term)
    })
    // Sort by date ascending
    results.sort((a, b) => {
      const d = a.fecha.localeCompare(b.fecha)
      if (d !== 0) return d
      return a.hora_inicio.localeCompare(b.hora_inicio)
    })
    setSearchResults(results)
    setShowSearchResults(true)
  }, [patientSearch, appointments])

  const fetchProfessionals = async () => {
    try {
      const response = await profesionalesApi.listar({ estado: 'Activo' })
      setProfessionals(response.data)
    } catch (error) {
      console.error('Error fetching professionals:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      // Calculate date range based on current view with generous buffer
      let fecha_desde: string
      let fecha_hasta: string
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      if (viewType === 'day') {
        // Fetch a week around the day
        const start = new Date(currentDate)
        start.setDate(start.getDate() - 3)
        const end = new Date(currentDate)
        end.setDate(end.getDate() + 3)
        fecha_desde = start.toISOString().split('T')[0]
        fecha_hasta = end.toISOString().split('T')[0]
      } else if (viewType === 'week') {
        // Fetch 2 weeks around the current week
        const start = new Date(currentDate)
        start.setDate(start.getDate() - start.getDay() - 7)
        const end = new Date(currentDate)
        end.setDate(end.getDate() - end.getDay() + 20)
        fecha_desde = start.toISOString().split('T')[0]
        fecha_hasta = end.toISOString().split('T')[0]
      } else {
        // Month view: fetch prev month + current month + next month
        const start = new Date(year, month - 1, 1)
        const end = new Date(year, month + 2, 0)
        fecha_desde = start.toISOString().split('T')[0]
        fecha_hasta = end.toISOString().split('T')[0]
      }

      const response = await turnosApi.listar({ limit: 5000, fecha_desde, fecha_hasta })
      if (response.data) {
        setAppointments(response.data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const getWeekDays = (date: Date) => {
    const days = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }

    return days
  }

  const getMinutesSinceStart = (timeStr: string) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    return (h * 60 + m) - (8 * 60) // Starting at 08:00
  }

  const getSlotHeight = 40

  const getAppointmentLayout = (dayAppointments: Turno[]) => {
    if (dayAppointments.length === 0) return []

    // Sort by start time then duration
    const sorted = [...dayAppointments].sort((a, b) => {
      const startA = getMinutesSinceStart(a.hora_inicio)
      const startB = getMinutesSinceStart(b.hora_inicio)
      if (startA !== startB) return startA - startB
      const durA = (getMinutesSinceStart(a.hora_fin) || 0) - startA
      const durB = (getMinutesSinceStart(b.hora_fin) || 0) - startB
      return durB - durA
    })

    const clusters: { appointments: any[], maxColumns: number }[] = []
    
    sorted.forEach(appt => {
      const start = getMinutesSinceStart(appt.hora_inicio)
      const end = getMinutesSinceStart(appt.hora_fin) || (start + 30)
      
      let cluster = clusters.find(c => c.appointments.some(a => {
        const aStart = getMinutesSinceStart(a.hora_inicio)
        const aEnd = getMinutesSinceStart(a.hora_fin) || (aStart + 30)
        return start < aEnd && end > aStart
      }))

      if (!cluster) {
        cluster = { appointments: [], maxColumns: 0 }
        clusters.push(cluster)
      }

      // Assign column
      let column = 0
      while (cluster.appointments.some(a => {
        if (a.column !== column) return false
        const aStart = getMinutesSinceStart(a.hora_inicio)
        const aEnd = getMinutesSinceStart(a.hora_fin) || (aStart + 30)
        return start < aEnd && end > aStart
      })) {
        column++
      }

      cluster.appointments.push({ ...appt, column })
      cluster.maxColumns = Math.max(cluster.maxColumns, column + 1)
    })

    return clusters.flatMap(cluster => cluster.appointments.map(a => ({
      ...a,
      top: (getMinutesSinceStart(a.hora_inicio) / 30) * getSlotHeight,
      height: Math.max(getSlotHeight / 2, (((getMinutesSinceStart(a.hora_fin) || (getMinutesSinceStart(a.hora_inicio) + 30)) - getMinutesSinceStart(a.hora_inicio)) / 30) * getSlotHeight),
      width: 100 / cluster.maxColumns,
      left: (a.column * 100) / cluster.maxColumns
    })))
  }

  const handleQuickConfirm = async (id: number) => {
    try {
      await turnosApi.confirmarPago(id, true)
      alert('Pago confirmado exitosamente')
      fetchAppointments() // Refresh appointments
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('Error al confirmar el pago')
    }
  }

  const handleDeleteAppointment = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este turno? Esta acción no se puede deshacer.')) {
      try {
        await turnosApi.eliminar(id)
        setSelectedAppointment(null)
        fetchAppointments()
        alert('Turno eliminado correctamente')
      } catch (error) {
        console.error('Error deleting appointment:', error)
        alert('Error al eliminar el turno')
      }
    }
  }

  const getAppointmentsForDate = (date: Date) => {
    // Use local date components to avoid timezone shifts
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`

    let filtered = appointments.filter(appointment => {
      if (!appointment.fecha) return false
      // Match the date string exactly
      const appointmentDate = appointment.fecha.split('T')[0]
      return appointmentDate === dateString
    })

    // Filter by selected professional if one is selected
    if (selectedProfessionalId !== null) {
      filtered = filtered.filter(appointment =>
        appointment.profesional_id === selectedProfessionalId
      )
    }

    return filtered.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  }

  const getInitials = (profesional?: any) => {
    if (!profesional) return '??'
    const n = profesional.nombre?.[0] || ''
    const a = profesional.apellido?.[0] || profesional.apellido?.[1] || ''
    return (n + a).toUpperCase()
  }

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (viewType === 'day') {
        newDate.setDate(prev.getDate() + (direction === 'prev' ? -1 : 1))
      } else if (viewType === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7))
      } else {
        newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
      }
      return newDate
    })
  }

  const handleDropAppointment = async (date: string, slot: string) => {
    if (!draggingAppointment) return

    try {
      // Calculate new hora_fin keeping original duration
      const [h1, m1] = draggingAppointment.hora_inicio.split(':').map(Number)
      const [h2, m2] = draggingAppointment.hora_fin.split(':').map(Number)
      const durationMin = (h2 * 60 + m2) - (h1 * 60 + m1)

      const [nh, nm] = slot.split(':').map(Number)
      const totalMin = nh * 60 + nm + durationMin
      const nfh = Math.floor(totalMin / 60)
      const nfm = totalMin % 60
      const hora_fin = `${String(nfh).padStart(2, '0')}:${String(nfm).padStart(2, '0')}`

      await turnosApi.actualizar(draggingAppointment.id, {
        fecha: date,
        hora_inicio: slot,
        hora_fin
      })
      
      fetchAppointments()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      alert('Error al reprogramar el turno')
    } finally {
      setDraggingAppointment(null)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (estado: string) => {
    return STATUS_COLORS[estado as keyof typeof STATUS_COLORS] || dentalColors.gray400
  }

  const getViewTitle = () => {
    if (viewType === 'day') {
      return currentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else if (viewType === 'week') {
      const weekDays = getWeekDays(currentDate)
      const start = weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      const end = weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${start} - ${end}`
    } else {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    }
  }

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`

    return (
      <Card className="overflow-hidden border-none shadow-xl bg-white rounded-2xl flex flex-col h-full">
        <div className="grid grid-cols-[100px_1fr] bg-gray-100 border-b border-gray-200 sticky top-0 z-20">
          <div className="p-2 border-r border-gray-200 flex items-center justify-center">
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-2 text-center bg-blue-50/50">
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}
            </div>
            <div className="text-lg font-black text-[#026498]">
              {currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white relative">
          <div className="relative">
            {/* Grid Lines */}
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="grid grid-cols-[100px_1fr] border-b border-gray-50 h-[40px]">
                <div className="p-1 text-[10px] font-bold text-gray-400 border-r border-gray-100 text-center flex items-center justify-center bg-gray-50/30">
                  {slot}
                </div>
                <div 
                  className={`relative group h-[40px] cursor-pointer transition-colors ${draggingAppointment ? 'bg-blue-50/10' : 'hover:bg-blue-50/20'}`}
                  onClick={() => {
                    setNewAppointmentData({ fecha: dateString, hora_inicio: slot, sobre_turno: false })
                    setShowNewModal(true)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleDropAppointment(dateString, slot)
                  }}
                />
              </div>
            ))}

            {/* Absolute Appointments */}
            <div className="absolute top-0 left-[100px] right-0 bottom-0 pointer-events-none">
              {getAppointmentLayout(dayAppointments).map((appt) => {
                const statusColor = getStatusColor(appt.estado)
                const isLight = ['#F59E0B', '#EAB308', '#22C55E'].includes(statusColor)
                
                return (
                  <div
                    key={appt.id}
                    className="absolute p-0.5 pointer-events-auto transition-all"
                    style={{
                      top: `${appt.top}px`,
                      height: `${appt.height}px`,
                      left: `${appt.left}%`,
                      width: `${appt.width}%`,
                    }}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('appointmentId', appt.id.toString())
                        setDraggingAppointment(appt)
                      }}
                      onDragEnd={() => setDraggingAppointment(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAppointment(appt)
                      }}
                      className="h-full w-full rounded-md shadow-md text-[10px] cursor-move hover:brightness-95 transition-all border-l-4 overflow-hidden flex flex-col p-2"
                      style={{
                        backgroundColor: statusColor,
                        borderColor: 'rgba(0,0,0,0.2)',
                        color: isLight ? '#000' : '#FFF',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                      }}
                    >
                      <div className="font-black truncate uppercase leading-tight text-[9px] mb-0.5">
                        {getInitials(appt.profesional)} - {appt.paciente?.apellido} {appt.paciente?.nombre}
                      </div>
                      <div className="text-[8px] font-bold opacity-90 leading-none">
                        {appt.hora_inicio.substring(0, 5)} - {appt.hora_fin.substring(0, 5)}
                      </div>
                      {appt.height > 40 && (
                        <div className="text-[7px] opacity-80 truncate mt-0.5 font-medium">
                          {appt.servicio?.nombre}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)

    return (
      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-2xl flex flex-col h-full">
        <div className="overflow-x-auto flex-1 flex flex-col border rounded-xl shadow-inner bg-gray-50/50">
          <div className="min-w-[1000px] flex-1 flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-20">
              <div className="p-2 border-r-2 border-gray-300 flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString()
                return (
                  <div key={i} className={`p-2 text-center border-r-2 border-gray-300 last:border-r-0 ${isToday ? 'bg-blue-100/50' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-black ${isToday ? 'text-[#026498]' : 'text-gray-900'}`}>
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grid Body */}
            <div className="relative bg-white flex-1 overflow-y-auto">
              <div className="relative">
                {/* Grid Rows */}
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 h-[40px]">
                    <div className="p-1 text-[9px] font-bold text-gray-500 border-r-2 border-gray-300 text-center flex items-center justify-center bg-gray-100 font-mono">
                      {slot}
                    </div>
                    {weekDays.map((day, i) => (
                      <div 
                        key={i} 
                        className={`border-r-2 border-gray-300 last:border-r-0 relative group transition-colors cursor-pointer ${draggingAppointment ? 'bg-blue-50/20' : 'hover:bg-blue-50/40'} ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
                        onClick={() => {
                          const y = day.getFullYear()
                          const m = String(day.getMonth() + 1).padStart(2, '0')
                          const d = String(day.getDate()).padStart(2, '0')
                          setNewAppointmentData({ fecha: `${y}-${m}-${d}`, hora_inicio: slot, sobre_turno: false })
                          setShowNewModal(true)
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const y = day.getFullYear()
                          const m = String(day.getMonth() + 1).padStart(2, '0')
                          const d = String(day.getDate()).padStart(2, '0')
                          handleDropAppointment(`${y}-${m}-${d}`, slot)
                        }}
                      />
                    ))}
                  </div>
                ))}

                {/* Absolute Appointments for each day column */}
                <div className="absolute top-0 left-[80px] right-0 bottom-0 pointer-events-none grid grid-cols-7">
                  {weekDays.map((day, dayIdx) => (
                    <div key={dayIdx} className="relative h-full border-r-2 border-transparent">
                      {getAppointmentLayout(getAppointmentsForDate(day)).map((appt) => {
                        const statusColor = getStatusColor(appt.estado)
                        const isLight = ['#F59E0B', '#EAB308', '#22C55E'].includes(statusColor)
                        
                        return (
                          <div
                            key={appt.id}
                            className="absolute p-0.5 pointer-events-auto transition-all"
                            style={{
                              top: `${appt.top}px`,
                              height: `${appt.height}px`,
                              left: `${appt.left}%`,
                              width: `${appt.width}%`,
                            }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('appointmentId', appt.id.toString())
                                setDraggingAppointment(appt)
                              }}
                              onDragEnd={() => setDraggingAppointment(null)}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAppointment(appt)
                              }}
                              className="h-full w-full rounded shadow-sm text-[8px] cursor-move hover:brightness-95 transition-all border-l-2 overflow-hidden flex flex-col p-1"
                              style={{
                                backgroundColor: statusColor,
                                borderColor: 'rgba(0,0,0,0.1)',
                                color: isLight ? '#000' : '#FFF',
                              }}
                            >
                              <div className="font-black truncate uppercase leading-tight text-[8px] mb-0.5">
                                {getInitials(appt.profesional)} {appt.paciente?.apellido} {appt.paciente?.nombre}
                              </div>
                              <div className="text-[7px] font-bold opacity-90 leading-none">
                                {appt.hora_inicio.substring(0, 5)} - {appt.hora_fin.substring(0, 5)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)

    return (
      <Card>
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className={`bg-[${dentalColors.gray100}] p-3 text-center`}>
              <span className={`text-sm font-semibold text-[${dentalColors.gray700}]`}>
                {day}
              </span>
            </div>
          ))}

          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day.date)
            const isToday = day.date.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 ${!day.isCurrentMonth ? 'opacity-50' : ''
                  }`}
              >
                <div className={`text-sm font-medium mb-2 ${isToday
                  ? `text-[${dentalColors.primary}] font-bold`
                  : day.isCurrentMonth
                    ? `text-[${dentalColors.gray900}]`
                    : `text-[${dentalColors.gray400}]`
                  }`}>
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const statusColor = getStatusColor(appointment.estado)
                    return (
                      <div
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        className="p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          borderLeft: `3px solid ${statusColor}`
                        }}
                      >
                        <div className="font-medium truncate">
                          {appointment.hora_inicio}
                        </div>
                        <div className="truncate opacity-75">
                          {appointment.paciente?.nombre} {appointment.paciente?.apellido}
                        </div>
                      </div>
                    )
                  })}

                  {dayAppointments.length > 3 && (
                    <div className={`text-xs text-[${dentalColors.gray500}] text-center py-1`}>
                      +{dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-4 mb-4">
        {/* Responsive Header Container */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex-shrink-0">
            <h2 className={`text-lg font-bold text-[${dentalColors.gray900}] capitalize tracking-tight`}>
              {getViewTitle()}
            </h2>
            <p className={`text-[${dentalColors.gray500}] text-[9px] font-medium`}>
              Gestión de Turnos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Group */}
            <div className="flex items-center bg-white border rounded-lg shadow-sm overflow-hidden h-8">
              <Button
                variant={viewType === 'day' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('day')}
                className={`rounded-none border-0 h-full px-2 ${viewType === 'day' ? 'bg-[#026498]' : 'text-gray-500'}`}
              >
                <span className="text-[10px] font-bold capitalize">Día</span>
              </Button>
              <Button
                variant={viewType === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('week')}
                className={`rounded-none border-x h-full px-2 ${viewType === 'week' ? 'bg-[#026498]' : 'text-gray-500'}`}
              >
                <span className="text-[10px] font-bold capitalize">Semana</span>
              </Button>
              <Button
                variant={viewType === 'month' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewType('month')}
                className={`rounded-none border-0 h-full px-2 ${viewType === 'month' ? 'bg-[#026498]' : 'text-gray-500'}`}
              >
                <span className="text-[10px] font-bold capitalize">Mes</span>
              </Button>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowBookingModal(true)}
                size="sm"
                variant="outline"
                className="h-8 border-[#026498] text-[#026498] hover:bg-blue-50 font-bold capitalize text-[10px] px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Turno
              </Button>
              <Button
                onClick={() => setShowNewModal(true)}
                size="sm"
                className="h-8 bg-[#026498] font-bold capitalize text-[10px] px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Sobreturno
              </Button>
            </div>

            {/* Filters & Nav Group */}
            <div className="flex items-center gap-1">
              <select
                value={selectedProfessionalId ?? ''}
                onChange={(e) => setSelectedProfessionalId(e.target.value ? Number(e.target.value) : null)}
                className="h-8 px-2 border border-gray-300 rounded-lg text-[10px] font-bold capitalize bg-white"
              >
                <option value="">Profesional</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.apellido}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-white border rounded-lg h-8 px-1">
                <button onClick={() => navigate('prev')} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={goToToday} className="px-2 text-[9px] font-bold capitalize text-[#026498]">
                  Hoy
                </button>
                <button onClick={() => navigate('next')} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Patient Search - Compact */}
          <div className="w-full sm:w-64">
            <div className="relative bg-white border rounded-lg px-2 py-1 shadow-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onFocus={() => patientSearch.trim().length >= 2 && setShowSearchResults(true)}
                className="w-full pl-6 pr-2 py-0.5 text-[10px] font-bold border-0 bg-transparent focus:ring-0"
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto overflow-x-hidden no-scrollbar">
                  <div className="p-1">
                    {searchResults.map((turno) => (
                      <div
                        key={turno.id}
                        onClick={() => {
                          setCurrentDate(new Date(turno.fecha + 'T12:00:00')) // Avoid midnight timezone issues
                          setViewType('day')
                          setPatientSearch('')
                          setShowSearchResults(false)
                          setSelectedAppointment(turno)
                        }}
                        className="p-2 hover:bg-blue-50 rounded-md cursor-pointer transition-colors border-b last:border-0"
                      >
                        <div className="text-[10px] font-black text-gray-900 uppercase">
                          {turno.paciente?.apellido} {turno.paciente?.nombre}
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 font-bold">
                          <span>{new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-ES')}</span>
                          <span>{turno.hora_inicio.substring(0, 5)} hs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showSearchResults && searchResults.length === 0 && patientSearch.trim().length >= 2 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 italic">No se encontraron turnos</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Color Legend - Wrapped */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center bg-white/50 p-2 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold capitalize text-gray-400 border-r pr-3">Legenda</span>
              {Object.entries(STATUS_COLORS).slice(0, 8).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-600 font-bold capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {viewType === 'day' && renderDayView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'month' && renderMonthView()}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className={`px-6 py-4 border-b border-[${dentalColors.gray200}]`}>
              <h3 className={`text-lg font-semibold text-[${dentalColors.gray900}]`}>
                Detalles del Turno
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium text-[${dentalColors.gray600}]`}>Estado</span>
                <span
                  className="px-2 py-1 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: `${getStatusColor(selectedAppointment.estado)}20`,
                    color: getStatusColor(selectedAppointment.estado)
                  }}
                >
                  {selectedAppointment.estado}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <CalendarIcon className={`h-4 w-4 text-[${dentalColors.gray400}] mr-3`} />
                  <div>
                    <p className={`font-medium text-[${dentalColors.gray900}]`}>
                      {new Date(selectedAppointment.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className={`text-sm text-[${dentalColors.gray600}]`}>
                      {selectedAppointment.hora_inicio} - {selectedAppointment.hora_fin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <User className={`h-4 w-4 text-[${dentalColors.gray400}] mr-3`} />
                  <div>
                    <p className={`font-medium text-[${dentalColors.gray900}]`}>
                      {selectedAppointment.paciente?.nombre} {selectedAppointment.paciente?.apellido}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      {selectedAppointment.paciente?.telefono && (
                        <div className={`flex items-center text-sm text-[${dentalColors.gray600}]`}>
                          <Phone className="h-3 w-3 mr-1" />
                          {selectedAppointment.paciente.telefono}
                        </div>
                      )}
                      {selectedAppointment.paciente?.email && (
                        <div className={`flex items-center text-sm text-[${dentalColors.gray600}]`}>
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedAppointment.paciente.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <User className={`h-4 w-4 text-[${dentalColors.gray400}] mr-3`} />
                  <div>
                    <p className={`font-medium text-[${dentalColors.gray900}]`}>
                      {selectedAppointment.profesional?.nombre} {selectedAppointment.profesional?.apellido}
                    </p>
                    <p className={`text-sm text-[${dentalColors.gray600}]`}>
                      {selectedAppointment.profesional?.especialidad}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Briefcase className={`h-4 w-4 text-[${dentalColors.gray400}] mr-3`} />
                  <div>
                    <p className={`font-medium text-[${dentalColors.gray900}]`}>
                      {selectedAppointment.servicio?.nombre}
                    </p>
                    <div className={`flex items-center text-sm text-[${dentalColors.primary}] font-semibold mt-1`}>
                      ${selectedAppointment.servicio?.precio_base}
                    </div>
                  </div>
                </div>

                {selectedAppointment.observaciones && (
                  <div>
                    <p className={`text-sm font-medium text-[${dentalColors.gray700}] mb-1`}>
                      Notas:
                    </p>
                    <p className={`text-sm text-[${dentalColors.gray600}] bg-[${dentalColors.gray50}] p-2 rounded`}>
                      {selectedAppointment.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteAppointment(selectedAppointment.id)}>
                  Eliminar Turno
                </Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                  Cerrar
                </Button>
                <Button onClick={() => setShowEditModal(true)}>
                  Editar Turno
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            fetchAppointments()
            setSelectedAppointment(null)
            setShowEditModal(false)
          }}
        />
      )}
      
      {showNewModal && (
        <AdminAppointmentModal
          initialData={newAppointmentData || undefined}
          onClose={() => {
            setShowNewModal(false)
            setNewAppointmentData(null)
          }}
          onCreate={() => {
            fetchAppointments()
            setShowNewModal(false)
            setNewAppointmentData(null)
            alert('Turno creado exitosamente')
          }}
        />
      )}

      {showBookingModal && (
        <AdminBookingModal
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            fetchAppointments()
            setShowBookingModal(false)
            alert('Turno agendado exitosamente')
          }}
        />
      )}
    </div>
  )
}