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
  X,
  Heart,
  Edit as EditIcon,
  FileText,
  Trash2,
  Shield,
} from 'lucide-react'
import { turnosApi } from '../../api'
import type { Turno, Profesional } from '../../types'
import { EditAppointmentModal } from './EditAppointmentModal'
import { AdminAppointmentModal } from './AdminAppointmentModal'
import { AdminBookingModal } from './AdminBookingModal'
import { profesionalesApi } from '../../api/profesionales'
import { feriadosApi, type Feriado } from '../../api/feriados'

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
  'Ausente sin aviso': '#991B1B', // Dark Red
} as const

// Simplified legend entries (collapse duplicate "Confirmado" variants)
const LEGEND_ENTRIES: [string, string][] = [
  ['Pendiente', '#F59E0B'],
  ['Creado', '#3B82F6'],
  ['Confirmado', '#22C55E'],
  ['En sala de espera', '#A855F7'],
  ['Atendiéndose', '#EC4899'],
  ['Atendido', '#06B6D4'],
  ['Cancelado', '#EF4444'],
  ['Ausente', '#000000'],
  ['Ausente sin aviso', '#991B1B'],
]

interface CalendarViewProps {
  onNavigateToPatient?: (id: string) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToPatient }) => {
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
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [splitByProfessional, setSplitByProfessional] = useState(false)

  const TIME_SLOTS = []
  for (let h = 8; h <= 20; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
  }

  useEffect(() => {
    fetchAppointments()
    fetchProfessionals()
    fetchFeriados()
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

  const fetchFeriados = async () => {
    try {
      const year = currentDate.getFullYear()
      const data = await feriadosApi.listar(year)
      setFeriados(data || [])
    } catch (error) {
      console.error('Error fetching feriados:', error)
    }
  }

  const getHolidayForDate = (date: Date): Feriado | undefined => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    return feriados.find(f => f.fecha === dateStr)
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
        // Fetch 2 weeks around the current week (Mon-Sat)
        const dayOfWeek = currentDate.getDay()
        const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const start = new Date(currentDate)
        start.setDate(start.getDate() + diffToMon - 7)
        const end = new Date(currentDate)
        end.setDate(end.getDate() + diffToMon + 19)
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
    // Convert Sunday=0 to Monday-based (Mon=0, Tue=1, ..., Sun=6)
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7

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
    const dayOfWeek = startOfWeek.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(date.getDate() + diff)

    for (let i = 0; i < 6; i++) {
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
      const end = weekDays[weekDays.length - 1].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
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

    const dayHoliday = getHolidayForDate(currentDate)
    const activeProfessionals = professionals.filter(p => p.estado === 'Activo')
    const cols = splitByProfessional ? activeProfessionals.length : 1

    return (
      <Card className="overflow-hidden border-none shadow-xl bg-white rounded-2xl flex flex-col h-full">
        <div className={`grid bg-gray-100 border-b border-gray-200 sticky top-0 z-20`} style={{ gridTemplateColumns: `100px repeat(${cols}, 1fr)` }}>
          <div className="p-2 border-r border-gray-200 flex items-center justify-center">
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          {!splitByProfessional ? (
            <div className={`p-2 text-center ${dayHoliday ? 'bg-red-50' : 'bg-blue-50/50'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest ${dayHoliday ? 'text-red-600' : 'text-blue-600'}`}>
                {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}
              </div>
              <div className={`text-lg font-black ${dayHoliday ? 'text-red-700' : 'text-[#026498]'}`}>
                {currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {dayHoliday && (
                <div className="text-[10px] font-bold text-red-600 mt-0.5">🚩 {dayHoliday.descripcion || 'Feriado'}</div>
              )}
            </div>
          ) : (
            activeProfessionals.map((prof) => (
              <div key={prof.id} className="p-2 text-center border-r border-gray-200 last:border-r-0 bg-blue-50/30">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#026498] truncate">
                  {prof.nombre} {prof.apellido}
                </div>
                <div className="text-[8px] font-bold text-gray-500 uppercase">{prof.especialidad}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-white relative">
          <div className="relative">
            {/* Grid Lines */}
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="grid border-b border-gray-50 h-[40px]" style={{ gridTemplateColumns: `100px repeat(${cols}, 1fr)` }}>
                <div className="p-1 text-[10px] font-bold text-gray-400 border-r border-gray-100 text-center flex items-center justify-center bg-gray-50/30">
                  {slot}
                </div>
                {Array.from({ length: cols }).map((_, i) => (
                  <div 
                    key={i}
                    className={`relative group h-[40px] border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors ${draggingAppointment ? 'bg-blue-50/10' : 'hover:bg-blue-50/20'}`}
                    onClick={() => {
                      const profId = splitByProfessional ? activeProfessionals[i].id : (selectedProfessionalId || undefined)
                      setNewAppointmentData({ 
                        fecha: dateString, 
                        hora_inicio: slot, 
                        sobre_turno: false,
                        profesional_id: profId as number
                      })
                      setShowNewModal(true)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDropAppointment(dateString, slot)
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Absolute Appointments */}
            <div className="absolute top-0 left-[100px] right-0 bottom-0 pointer-events-none">
              {(!splitByProfessional ? [dayAppointments] : activeProfessionals.map(p => dayAppointments.filter(a => a.profesional_id === p.id))).map((group, colIdx) => {
                const colWidth = 100 / cols
                const colLeft = colIdx * colWidth
                
                return getAppointmentLayout(group).map((appt) => {
                  const statusColor = getStatusColor(appt.estado)
                  const isLight = ['#F59E0B', '#EAB308', '#22C55E'].includes(statusColor)
                  
                  return (
                    <div
                      key={appt.id}
                      className="absolute p-0.5 pointer-events-auto transition-all"
                      style={{
                        top: `${appt.top}px`,
                        height: `${appt.height}px`,
                        left: `${colLeft + (appt.left * colWidth / 100)}%`,
                        width: `${appt.width * colWidth / 100}%`,
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
                          {appt.paciente?.apellido} {appt.paciente?.nombre}
                        </div>
                        <div className="text-[8px] font-bold opacity-90 leading-none">
                          {appt.hora_inicio.substring(0, 5)} - {appt.hora_fin.substring(0, 5)}
                        </div>
                        {appt.height > 40 && (
                          <div className="text-[7px] opacity-80 truncate mt-0.5 font-medium">
                            {!splitByProfessional && `${getInitials(appt.profesional)} - `} {appt.servicio?.nombre}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
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
            <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-20">
              <div className="p-2 border-r-2 border-gray-300 flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString()
                const holiday = getHolidayForDate(day)
                return (
                  <div key={i} className={`p-2 text-center border-r-2 border-gray-300 last:border-r-0 ${holiday ? 'bg-red-50' : isToday ? 'bg-blue-100/50' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${holiday ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-black ${holiday ? 'text-red-700' : isToday ? 'text-[#026498]' : 'text-gray-900'}`}>
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                    {holiday && (
                      <div className="text-[8px] font-bold text-red-600 truncate px-1" title={holiday.descripcion}>
                        🚩 {holiday.descripcion || 'Feriado'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Grid Body */}
            <div className="relative bg-white flex-1 overflow-y-auto">
              <div className="relative">
                {/* Grid Rows */}
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-gray-200 h-[40px]">
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
                <div className="absolute top-0 left-[80px] right-0 bottom-0 pointer-events-none grid grid-cols-6">
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
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className={`bg-[${dentalColors.gray100}] p-3 text-center`}>
              <span className={`text-sm font-semibold text-[${dentalColors.gray700}]`}>
                {day}
              </span>
            </div>
          ))}

          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day.date)
            const isToday = day.date.toDateString() === new Date().toDateString()
            const holiday = getHolidayForDate(day.date)

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 ${!day.isCurrentMonth ? 'opacity-50' : ''} ${holiday ? 'bg-red-50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-1 mb-2">
                  <div className={`text-sm font-medium ${isToday
                    ? `text-[${dentalColors.primary}] font-bold`
                    : day.isCurrentMonth
                      ? `text-[${dentalColors.gray900}]`
                      : `text-[${dentalColors.gray400}]`
                    }`}>
                    {day.date.getDate()}
                  </div>
                  {holiday && (
                    <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full truncate max-w-[90px]" title={holiday.descripcion}>
                      🚩 {holiday.descripcion || 'Feriado'}
                    </span>
                  )}
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
                <button
                  onClick={() => setSplitByProfessional(!splitByProfessional)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors ${splitByProfessional ? 'bg-[#026498] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Dividir por profesional"
                >
                  Dividir
                </button>
              </div>

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
              {LEGEND_ENTRIES.map(([status, color]) => (
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

      {selectedAppointment && !showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-[95%] sm:max-w-2xl h-fit max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            <div className={`px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white`}>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Detalles del Turno</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gestión de Paciente</p>
              </div>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Patient Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border-2 border-blue-100 shadow-inner">
                  <span className="text-2xl font-black text-[#026498] uppercase">
                    {selectedAppointment.paciente?.nombre?.[0]}{selectedAppointment.paciente?.apellido?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-2xl font-black text-gray-900 leading-tight">
                    {selectedAppointment.paciente?.apellido}, {selectedAppointment.paciente?.nombre}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedAppointment.paciente?.tipo_documento}: {selectedAppointment.paciente?.numero_documento}
                    </span>
                    <span
                      className="px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm"
                      style={{
                        backgroundColor: `${getStatusColor(selectedAppointment.estado)}20`,
                        color: getStatusColor(selectedAppointment.estado),
                        border: `1px solid ${getStatusColor(selectedAppointment.estado)}40`
                      }}
                    >
                      {selectedAppointment.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Obra Social - Quick View */}
              {selectedAppointment.paciente?.obraSocial && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Shield className="h-4 w-4 text-[#026498]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Obra Social</span>
                    <p className="text-sm font-bold text-[#026498]">{selectedAppointment.paciente.obraSocial.nombre}</p>
                  </div>
                </div>
              )}

              {/* Contact Info Bento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-3 w-3 text-[#026498]" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedAppointment.paciente?.telefono || 'No registrado'}</p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3 w-3 text-[#026498]" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedAppointment.paciente?.email || 'No registrado'}</p>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-5 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#026498]" />
                
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <CalendarIcon className="h-5 w-5 text-[#026498]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha y Hora</p>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedAppointment.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      <span className="text-[#026498] ml-2">{selectedAppointment.hora_inicio.substring(0, 5)} - {selectedAppointment.hora_fin.substring(0, 5)} hs</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profesional</p>
                    <p className="font-bold text-gray-900">
                      {selectedAppointment.profesional?.nombre} {selectedAppointment.profesional?.apellido}
                      <span className="text-purple-600 text-xs ml-2 font-medium">({selectedAppointment.profesional?.especialidad})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Heart className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Servicio</p>
                    <p className="font-bold text-gray-900">{selectedAppointment.servicio?.nombre}</p>
                  </div>
                </div>
              </div>

              {selectedAppointment.observaciones && (
                <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="h-3 w-3" /> Observaciones
                  </p>
                  <p className="text-sm font-medium text-amber-900 italic">"{selectedAppointment.observaciones}"</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="flex-1 min-w-[120px] rounded-2xl h-12 border-2 border-gray-200 font-black text-xs uppercase tracking-widest hover:bg-white hover:border-[#026498] hover:text-[#026498] transition-all"
                onClick={() => {
                  setShowEditModal(true)
                }}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Editar Turno
              </Button>
              
              <Button
                className="flex-1 min-w-[120px] rounded-2xl h-12 bg-[#026498] shadow-lg shadow-blue-900/20 font-black text-xs uppercase tracking-widest hover:bg-[#0c4a6e] transition-all"
                onClick={() => {
                  if (onNavigateToPatient && selectedAppointment.paciente?.id) {
                    onNavigateToPatient(selectedAppointment.paciente.id)
                  }
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Ficha Paciente
              </Button>

              {['Confirmado', 'Confirmado por Whatsapp', 'En sala de espera'].includes(selectedAppointment.estado) && (
                <Button
                  className="w-full rounded-2xl h-12 bg-pink-600 shadow-lg shadow-pink-900/20 font-black text-xs uppercase tracking-widest hover:bg-pink-700 transition-all text-white"
                  onClick={async () => {
                    try {
                      await turnosApi.actualizar(selectedAppointment.id, { estado: 'Atendiéndose' })
                      fetchAppointments()
                      setSelectedAppointment(null)
                    } catch (error) {
                      alert('Error al iniciar atención')
                    }
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Iniciar Atención
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full rounded-2xl h-12 border-2 border-red-100 font-black text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                onClick={() => handleDeleteAppointment(selectedAppointment.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Turno
              </Button>
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