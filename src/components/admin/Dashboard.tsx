import React, { useEffect, useState, useMemo } from 'react'
import { Card } from '../ui/Card'
import {
  Calendar,
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle2,
  Gift,
  Send,
  TrendingDown,
  ChevronRight
} from 'lucide-react'
import { turnosApi, profesionalesApi, serviciosApi, pacientesApi } from '../../api'
import type { Turno, Paciente, AuthUser, Profesional, Servicio } from '../../types'

type Timeframe = 'hoy' | 'semana' | 'mes' | '30dias' | 'anio' | 'todo'

interface DashboardProps {
  onNavigateToCalendar?: () => void
  user?: AuthUser | null
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToCalendar, user }) => {
  const [allTurnos, setAllTurnos] = useState<Turno[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [birthdaysToday, setBirthdaysToday] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<Timeframe>('mes')
  const [showBirthdaysModal, setShowBirthdaysModal] = useState(false)

  // Helper consistent date parser to avoid timezone issues (uses local noon)
  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return 0
    const parts = dateStr.split('-')
    if (parts.length !== 3) return 0
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const day = parseInt(parts[2], 10)

    const today = new Date()
    let age = today.getFullYear() - year
    const m = (today.getMonth() + 1) - month
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--
    }
    return age
  }

  // Initial fetch of data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch from 180 days ago to 90 days from now to have comparison range
        const desde = new Date()
        desde.setDate(desde.getDate() - 180)
        const hasta = new Date()
        hasta.setDate(hasta.getDate() + 90)

        const todayDate = new Date()
        const todayDay = todayDate.getDate()
        const todayMonth = todayDate.getMonth() + 1

        const [turnosResponse, profesionalesResponse, serviciosResponse, pacientesResponse, totalPacientesResponse] = await Promise.all([
          turnosApi.listar({
            limit: 5000,
            fecha_desde: desde.toISOString().split('T')[0],
            fecha_hasta: hasta.toISOString().split('T')[0]
          }),
          profesionalesApi.listar({ estado: 'Activo' }),
          serviciosApi.listar(),
          pacientesApi.listar({
            limit: 1000,
            mes_nacimiento: todayMonth
          }),
          pacientesApi.listar({ limit: 1 })
        ])

        const turnos = turnosResponse.data || []
        const activeProfessionals = profesionalesResponse.data || []
        const activeServices = serviciosResponse.data || []
        const patients = pacientesResponse.data || []

        setAllTurnos(turnos)
        setProfesionales(activeProfessionals)
        setServicios(activeServices)
        setTotalPacientes(totalPacientesResponse.pagination?.totalItems || patients.length)

        // Filter birthdays today
        const birthdays = patients.filter(p => {
          if (!p.fecha_nacimiento) return false
          const parts = p.fecha_nacimiento.split('-')
          if (parts.length !== 3) return false
          const birthMonth = parseInt(parts[1], 10)
          const birthDay = parseInt(parts[2], 10)
          return birthDay === todayDay && birthMonth === todayMonth
        })
        setBirthdaysToday(birthdays)

      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Timeframe date ranges helper
  const dateRanges = useMemo(() => {
    const now = new Date()
    const currentStart = new Date(now)
    const currentEnd = new Date(now)
    const prevStart = new Date(now)
    const prevEnd = new Date(now)

    currentStart.setHours(0, 0, 0, 0)
    currentEnd.setHours(23, 59, 59, 999)
    prevStart.setHours(0, 0, 0, 0)
    prevEnd.setHours(23, 59, 59, 999)

    if (timeframe === 'hoy') {
      prevStart.setDate(prevStart.getDate() - 1)
      prevEnd.setDate(prevEnd.getDate() - 1)
    } else if (timeframe === 'semana') {
      // Find Monday
      const currentDay = now.getDay()
      const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
      currentStart.setDate(diffToMonday)
      currentEnd.setDate(diffToMonday + 6)

      prevStart.setDate(diffToMonday - 7)
      prevEnd.setDate(diffToMonday - 1)
    } else if (timeframe === 'mes') {
      currentStart.setDate(1)
      currentEnd.setMonth(currentEnd.getMonth() + 1, 0)

      prevStart.setMonth(prevStart.getMonth() - 1, 1)
      prevEnd.setDate(0) // Last day of previous month
    } else if (timeframe === '30dias') {
      currentStart.setDate(currentStart.getDate() - 30)

      prevStart.setDate(prevStart.getDate() - 60)
      prevEnd.setDate(prevEnd.getDate() - 31)
    } else if (timeframe === 'anio') {
      currentStart.setMonth(0, 1)
      currentEnd.setMonth(11, 31)

      prevStart.setFullYear(prevStart.getFullYear() - 1, 0, 1)
      prevEnd.setFullYear(prevEnd.getFullYear() - 1, 11, 31)
    } else {
      // Histórico / Todo
      currentStart.setFullYear(2020, 0, 1)
      currentEnd.setFullYear(2035, 11, 31)
      return { currentStart, currentEnd, prevStart: null, prevEnd: null }
    }

    return { currentStart, currentEnd, prevStart, prevEnd }
  }, [timeframe])

  // Computed metrics for current and previous period
  const metrics = useMemo(() => {
    const filterByRange = (start: Date, end: Date) => {
      return allTurnos.filter(t => {
        const d = parseDateString(t.fecha)
        return d >= start && d <= end
      })
    }

    const currentTurnos = filterByRange(dateRanges.currentStart, dateRanges.currentEnd)
    const prevTurnos = dateRanges.prevStart && dateRanges.prevEnd 
      ? filterByRange(dateRanges.prevStart, dateRanges.prevEnd) 
      : []

    // Totals
    const totalCurrent = currentTurnos.length
    const totalPrev = prevTurnos.length
    const totalChange = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : 0

    // Attendance Rate (Atendidos / Atendidos + Ausentes)
    const atendidosCurrent = currentTurnos.filter(t => t.estado === 'Atendido').length
    const ausentesCurrent = currentTurnos.filter(t => t.estado === 'Ausente').length
    const totalAttendDenom = atendidosCurrent + ausentesCurrent
    const attendanceRateCurrent = totalAttendDenom > 0 ? (atendidosCurrent / totalAttendDenom) * 100 : 0

    const atendidosPrev = prevTurnos.filter(t => t.estado === 'Atendido').length
    const ausentesPrev = prevTurnos.filter(t => t.estado === 'Ausente').length
    const totalAttendDenomPrev = atendidosPrev + ausentesPrev
    const attendanceRatePrev = totalAttendDenomPrev > 0 ? (atendidosPrev / totalAttendDenomPrev) * 100 : 0
    const attendanceRateChange = attendanceRateCurrent - attendanceRatePrev

    // Status breakdown
    const turnosPorEstado: Record<string, number> = {}
    currentTurnos.forEach(t => {
      turnosPorEstado[t.estado] = (turnosPorEstado[t.estado] || 0) + 1
    })

    // Workload by professional
    const turnosPorProf: Record<string, { count: number; color?: string }> = {}
    profesionales.forEach(p => {
      const key = `${p.nombre} ${p.apellido}`
      turnosPorProf[key] = { count: 0, color: p.color }
    })
    currentTurnos.forEach(t => {
      if (t.profesional) {
        const key = `${t.profesional.nombre} ${t.profesional.apellido}`
        if (!turnosPorProf[key]) {
          turnosPorProf[key] = { count: 0, color: t.profesional.color }
        }
        turnosPorProf[key].count++
      }
    })

    // Popular services
    const turnosPorServicio: Record<string, { count: number; name: string }> = {}
    servicios.forEach(s => {
      turnosPorServicio[s.nombre] = { count: 0, name: s.nombre }
    })
    currentTurnos.forEach(t => {
      if (t.servicio) {
        const key = t.servicio.nombre
        if (!turnosPorServicio[key]) {
          turnosPorServicio[key] = { count: 0, name: t.servicio.nombre }
        }
        turnosPorServicio[key].count++
      }
    })
    const popularServices = Object.values(turnosPorServicio)
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Trend series generation
    let trendData: { label: string; count: number }[] = []
    if (timeframe === 'hoy') {
      const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00 to 20:00
      trendData = hours.map(h => {
        const label = `${h.toString().padStart(2, '0')} hs`
        const count = currentTurnos.filter(t => {
          const hour = parseInt(t.hora_inicio.split(':')[0], 10)
          return hour === h
        }).length
        return { label, count }
      })
    } else if (timeframe === 'semana') {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      trendData = days.map((dayName, idx) => {
        const d = new Date(dateRanges.currentStart)
        d.setDate(d.getDate() + idx)
        const dateStr = d.toISOString().split('T')[0]
        const count = currentTurnos.filter(t => t.fecha === dateStr).length
        return { label: dayName, count }
      })
    } else if (timeframe === 'mes') {
      trendData = [
        { label: 'Sem 1', count: 0 },
        { label: 'Sem 2', count: 0 },
        { label: 'Sem 3', count: 0 },
        { label: 'Sem 4', count: 0 },
        { label: 'Sem 5', count: 0 }
      ]
      currentTurnos.forEach(t => {
        const day = parseDateString(t.fecha).getDate()
        if (day <= 7) trendData[0].count++
        else if (day <= 14) trendData[1].count++
        else if (day <= 21) trendData[2].count++
        else if (day <= 28) trendData[3].count++
        else trendData[4].count++
      })
    } else if (timeframe === '30dias') {
      trendData = Array.from({ length: 6 }).map((_, i) => {
        const startDay = new Date(dateRanges.currentStart)
        startDay.setDate(startDay.getDate() + i * 5)
        const endDay = new Date(startDay)
        endDay.setDate(endDay.getDate() + 4)
        
        const label = `${startDay.getDate()}/${startDay.getMonth()+1}`
        const count = currentTurnos.filter(t => {
          const d = parseDateString(t.fecha)
          return d >= startDay && d <= endDay
        }).length
        return { label, count }
      })
    } else if (timeframe === 'anio') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      trendData = months.map((monthName, idx) => {
        const count = currentTurnos.filter(t => {
          const d = parseDateString(t.fecha)
          return d.getMonth() === idx && d.getFullYear() === dateRanges.currentStart.getFullYear()
        }).length
        return { label: monthName, count }
      })
    } else {
      // Historical trend of last 6 months
      const monthsToShow = 6
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const year = d.getFullYear()
        const month = d.getMonth()
        const label = `${monthNames[month]} ${year.toString().slice(-2)}`
        const count = currentTurnos.filter(t => {
          const td = parseDateString(t.fecha)
          return td.getMonth() === month && td.getFullYear() === year
        }).length
        trendData.push({ label, count })
      }
    }

    return {
      currentTurnos,
      totalCurrent,
      totalPrev,
      totalChange,
      attendanceRateCurrent,
      attendanceRatePrev,
      attendanceRateChange,
      turnosPorEstado,
      turnosPorProf,
      popularServices,
      trendData
    }
  }, [allTurnos, dateRanges, timeframe, profesionales, servicios])

  // Derive lists directly from allTurnos
  const turnosPendientes = useMemo(() => {
    return allTurnos
      .filter(t => t.estado === 'Pendiente')
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
  }, [allTurnos])

  const turnosRecientes = useMemo(() => {
    return allTurnos
      .filter(t => t.estado !== 'Pendiente')
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio))
      .slice(0, 5)
  }, [allTurnos])

  // Actions handlers
  const handleConfirmAll = async () => {
    if (!window.confirm('¿Estás seguro de que quieres confirmar TODOS los turnos pendientes?')) {
      return
    }

    try {
      setLoading(true)
      const response = await turnosApi.confirmarTodosPendientes()
      alert(response.message)
      // Reload page to reflect mass update
      window.location.reload()
    } catch (error) {
      console.error('Error confirming all appointments:', error)
      alert('Error al confirmar los turnos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      setLoading(true)
      await turnosApi.confirmarPago(id, true)
      
      // Update locally
      setAllTurnos(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, estado: 'Confirmado por email', pago_confirmado: true }
        }
        return t
      }))
      
      alert('Turno aprobado exitosamente')
    } catch (error) {
      console.error('Error approving appointment:', error)
      alert('Error al aprobar el turno')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar este turno? El paciente recibirá una notificación.')) {
      return
    }

    try {
      setLoading(true)
      await turnosApi.confirmarPago(id, false)
      
      // Update locally
      setAllTurnos(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, estado: 'Cancelado', pago_confirmado: false }
        }
        return t
      }))

      alert('Turno rechazado correctamente')
    } catch (error) {
      console.error('Error rejecting appointment:', error)
      alert('Error al rechazar el turno')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Trend Chart SVG mapping
  const maxTrendValue = Math.max(...metrics.trendData.map(d => d.count), 1)
  const chartWidth = 600
  const chartHeight = 220
  const paddingX = 40
  const paddingY = 30

  const chartPoints = metrics.trendData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - 2 * paddingX)) / (metrics.trendData.length - 1 || 1)
    const y = chartHeight - paddingY - (d.count / maxTrendValue) * (chartHeight - 2 * paddingY)
    return { x, y, label: d.label, count: d.count }
  })

  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - paddingY} L ${chartPoints[0].x} ${chartHeight - paddingY} Z`
    : ''

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header - Welcome banner */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            {user ? `¡Bienvenido de vuelta, ${user.nombre}! 👋` : 'Panel de Control ODAF ✨'}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Resumen en tiempo real, análisis de rendimiento y gestión de turnos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="px-4 py-2.5 border border-slate-200 hover:border-[#026498] text-slate-700 hover:text-[#026498] font-bold text-sm rounded-xl transition-all flex items-center gap-2"
            >
              Ver Calendario
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleConfirmAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#026498] hover:bg-[#0284c7] text-white font-bold text-sm rounded-xl shadow-md shadow-sky-900/10 transition-all transform active:scale-95"
          >
            <CheckCircle2 className="h-4.5 w-4.5" />
            Confirmar pendientes
          </button>
        </div>
      </div>



      {/* Pending Appointments Section */}
      {turnosPendientes.length > 0 && (
        <div className="bg-amber-50/20 border border-amber-100 rounded-3xl p-6 transition-all">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              Turnos Pendientes de Aprobación
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {turnosPendientes.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {turnosPendientes.map((turno) => (
              <div key={turno.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paciente</span>
                    <span className="font-bold text-slate-800 text-sm block">{turno.paciente?.nombre} {turno.paciente?.apellido}</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">DNI: {turno.paciente?.numero_documento}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      {new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-1">{turno.hora_inicio} hs</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2.5 border-t border-b border-slate-50 my-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Briefcase size={13} className="text-[#026498]" />
                    <span className="truncate max-w-[100px]">{turno.servicio?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Users size={13} className="text-purple-500" />
                    <span>Dr. {turno.profesional?.apellido}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-4">
                  <button
                    onClick={() => handleReject(turno.id)}
                    className="flex-1 py-2 text-xs font-bold text-red-500 bg-red-50/50 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(turno.id)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-[#026498] hover:bg-[#0284c7] rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Statistics Block */}
      <div className="space-y-6">
        {/* Timeframe Selector & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Estadísticas e Informes</h3>
            <p className="text-slate-500 text-sm font-semibold">Filtra y visualiza el rendimiento de la clínica según el periodo.</p>
          </div>
          {/* Fingoals inspired toggle bar */}
          <div className="bg-white border border-slate-200/80 p-1 rounded-2xl flex flex-wrap gap-1 shadow-sm">
            {(['hoy', 'semana', 'mes', '30dias', 'anio', 'todo'] as const).map((tf) => {
              const labelMap: Record<Timeframe, string> = {
                hoy: 'Hoy',
                semana: 'Semana',
                mes: 'Mes',
                '30dias': '30 días',
                anio: 'Año',
                todo: 'Histórico'
              }
              const isActive = timeframe === tf
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#026498] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {labelMap[tf]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Overview cards - dynamic metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Turnos */}
          <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 p-6 flex flex-col justify-between min-h-[150px] h-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Turnos Reservados</span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#026498]">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{metrics.totalCurrent}</span>
              {timeframe !== 'todo' && (
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                  metrics.totalChange >= 0 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-rose-600 bg-rose-50'
                }`}>
                  {metrics.totalChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(metrics.totalChange).toFixed(1)}%
                </span>
              )}
            </div>
          </Card>

          {/* Card 2: Cumpleaños de Hoy */}
          <Card 
            onClick={() => {
              if (birthdaysToday.length > 0) {
                setShowBirthdaysModal(true)
              }
            }}
            className={`p-6 flex flex-col justify-between min-h-[150px] h-auto transition-all duration-300 ${
              birthdaysToday.length > 0 
                ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer border-pink-100 hover:border-pink-200 bg-gradient-to-br from-white to-pink-50/10' 
                : 'hover:shadow-md hover:scale-[1.01] opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cumpleaños de Hoy</span>
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{birthdaysToday.length}</span>
                <span className="text-[11px] font-semibold text-slate-400 block mt-1">
                  {birthdaysToday.length === 1 ? 'Paciente cumple hoy' : 'Pacientes cumplen hoy'}
                </span>
              </div>
              {birthdaysToday.length > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBirthdaysModal(true)
                  }}
                  className="px-3.5 py-2 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-500/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1.5"
                >
                  <span>Ver detalles</span>
                  <span>🍰</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                  Sin cumpleaños
                </span>
              )}
            </div>
          </Card>

          {/* Card 3: Tasa de Asistencia (Gauge) */}
          <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 p-6 flex items-center justify-between min-h-[150px] h-auto relative overflow-hidden">
            <div className="flex flex-col justify-between self-stretch">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tasa Asistencia</span>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {metrics.attendanceRateCurrent.toFixed(1)}%
                </span>
                {timeframe !== 'todo' && (
                  <span className={`text-[10px] font-bold block mt-1 ${
                    metrics.attendanceRateChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {metrics.attendanceRateChange >= 0 ? '+' : ''}
                    {metrics.attendanceRateChange.toFixed(1)}% vs anterior
                  </span>
                )}
              </div>
            </div>
            {/* Round Gauge inside card */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" className="stroke-slate-100" strokeWidth="10" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#026498] transition-all duration-500 ease-out"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - metrics.attendanceRateCurrent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-500">
                OK
              </div>
            </div>
          </Card>

          {/* Card 4: Pacientes Totales */}
          <Card className="hover:shadow-md hover:scale-[1.01] transition-all duration-300 p-6 flex flex-col justify-between min-h-[150px] h-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pacientes Totales</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalPacientes}</span>
              <span className="text-[10px] font-bold text-slate-400">Pacientes clínicos</span>
            </div>
          </Card>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SVG Trend Chart */}
            <Card className="p-6 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Evolución de Actividad</h4>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Volumen de turnos en el rango seleccionado</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#026498]"></span>
                  <span className="text-xs font-bold text-slate-500">Turnos</span>
                </div>
              </div>
              <div className="h-64 relative flex items-end">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#026498" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#026498" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f8fafc" strokeWidth={1.5} />
                  <line x1={paddingX} y1={(paddingY + chartHeight - paddingY)/2} x2={chartWidth - paddingX} y2={(paddingY + chartHeight - paddingY)/2} stroke="#f8fafc" strokeWidth={1.5} />
                  <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" strokeWidth={1.5} />

                  {/* Area fill under curve */}
                  {areaPath && <path d={areaPath} fill="url(#chart-gradient)" />}

                  {/* Curve Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#026498"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Point Circles with hover tooltip */}
                  {chartPoints.map((p, i) => (
                    <g key={i} className="group/point">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={4.5}
                        className="fill-white stroke-[#026498] stroke-[3px] cursor-pointer hover:r-6 hover:stroke-[4px] transition-all duration-150"
                      />
                      {/* Interactive Tooltip Overlay */}
                      <g className="opacity-0 pointer-events-none group-hover/point:opacity-100 transition-opacity duration-150">
                        <rect
                          x={p.x - 35}
                          y={p.y - 38}
                          width={70}
                          height={26}
                          rx={6}
                          className="fill-slate-800 shadow-md"
                        />
                        <text
                          x={p.x}
                          y={p.y - 21}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-bold"
                        >
                          {p.count} turnos
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Bottom Labels */}
                  {chartPoints.map((p, i) => {
                    const totalPoints = chartPoints.length
                    const showLabel = totalPoints <= 7 || i === 0 || i === totalPoints - 1 || i === Math.floor(totalPoints / 2) || (totalPoints === 12 && i % 2 === 0)
                    if (!showLabel) return null
                    return (
                      <text
                        key={i}
                        x={p.x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-bold"
                      >
                        {p.label}
                      </text>
                    )
                  })}
                </svg>
              </div>
            </Card>

            {/* Turnos por Profesional */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Carga de Trabajo por Profesional
              </h4>
              {Object.keys(metrics.turnosPorProf).length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center font-semibold">No hay turnos registrados en este período</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries(metrics.turnosPorProf)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([nombre, { count, color }]) => {
                      const sharePercentage = (count / metrics.totalCurrent * 100).toFixed(0)
                      return (
                        <div key={nombre} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700">{nombre}</span>
                            <span className="text-xs font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                              {count} turnos ({sharePercentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${sharePercentage}%`,
                                backgroundColor: color || '#026498' 
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Statistics Column */}
          <div className="space-y-6">
            {/* Turnos por Estado */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Estado de Turnos
              </h4>
              <div className="space-y-4">
                {['Pendiente', 'Confirmado', 'Confirmado por email', 'Atendido', 'Cancelado', 'Ausente'].map((estado) => {
                  // Sum up emails, whatsapp, sms if they are variants of Confirmado
                  let count = 0
                  if (estado === 'Confirmado') {
                    count = Object.entries(metrics.turnosPorEstado)
                      .filter(([k]) => k.startsWith('Confirmado'))
                      .reduce((sum, [, val]) => sum + val, 0)
                  } else if (estado === 'Confirmado por email') {
                    // Skip render to avoid duplication with general 'Confirmado'
                    return null
                  } else {
                    count = metrics.turnosPorEstado[estado] || 0
                  }

                  const percentage = metrics.totalCurrent > 0 ? (count / metrics.totalCurrent * 100).toFixed(0) : '0'

                  const colorsMap: Record<string, string> = {
                    'Pendiente': 'bg-amber-500',
                    'Confirmado': 'bg-[#026498]',
                    'Atendido': 'bg-emerald-500',
                    'Cancelado': 'bg-rose-500',
                    'Ausente': 'bg-slate-400'
                  }

                  return (
                    <div key={estado} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>{estado === 'Confirmado' ? 'Confirmados (Todos)' : estado}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorsMap[estado] || 'bg-slate-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Servicios más solicitados */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#026498]" />
                Servicios más Solicitados
              </h4>
              {metrics.popularServices.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center font-semibold">No hay servicios solicitados en este período</p>
              ) : (
                <div className="space-y-4">
                  {metrics.popularServices.map((srv, idx) => {
                    const percentage = (srv.count / metrics.totalCurrent * 100).toFixed(0)
                    return (
                      <div key={srv.name} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[150px]">{idx+1}. {srv.name}</span>
                          <span>{srv.count} turnos</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Participación: {percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Turnos Recientes */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Actividad Reciente
              </h4>
              <div className="space-y-3">
                {turnosRecientes.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center font-semibold">No hay actividad reciente</p>
                ) : (
                  turnosRecientes.map((turno) => {
                    const statusColors: Record<string, string> = {
                      'Atendido': 'text-emerald-600 bg-emerald-50 border-emerald-100',
                      'Cancelado': 'text-rose-600 bg-rose-50 border-rose-100',
                      'Ausente': 'text-slate-500 bg-slate-50 border-slate-100'
                    }
                    const statusStyle = statusColors[turno.estado] || 'text-[#026498] bg-sky-50 border-sky-100'
                    
                    return (
                      <div key={turno.id} className="flex items-start justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/30 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {turno.paciente?.nombre} {turno.paciente?.apellido}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                            {turno.servicio?.nombre} | Dr. {turno.profesional?.apellido}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-400 block">
                            {new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 ${statusStyle}`}>
                            {turno.estado.startsWith('Confirmado') ? 'Confirmado' : turno.estado}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Birthday Patients Modal Popup */}
      {showBirthdaysModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                    Cumpleaños de Hoy 🎉
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {birthdaysToday.length} {birthdaysToday.length === 1 ? 'paciente cumple' : 'pacientes cumplen'} años hoy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBirthdaysModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - scrollable list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 no-scrollbar">
              {birthdaysToday.map((p) => {
                const cleanPhone = p.telefono ? p.telefono.replace(/[^\d+]/g, '') : '';
                const whatsappUrl = cleanPhone 
                  ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone : `54${cleanPhone}`}?text=${encodeURIComponent(`¡Hola ${p.nombre}! Feliz cumpleaños de parte de todo el equipo de ODAF. Que tengas un hermoso día 🎂🎈`)}`
                  : null;

                return (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {p.nombre} {p.apellido}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-semibold text-slate-500">
                        {p.fecha_nacimiento && (
                          <span>Edad: <strong className="text-pink-600">{calculateAge(p.fecha_nacimiento)} años</strong></span>
                        )}
                        {p.numero_documento && (
                          <span>DNI: {p.numero_documento}</span>
                        )}
                      </div>
                    </div>
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-md shadow-green-900/5 transition-all transform hover:-translate-y-0.5 uppercase tracking-wider whitespace-nowrap"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Saludar
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Sin teléfono</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowBirthdaysModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}