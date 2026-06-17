import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { patientPortalApi } from "../../api/patient-portal"
import { dentalColors } from "../../config/colors"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { format, parseISO, addDays, startOfDay } from "date-fns"
import { es } from "date-fns/locale"

export const ReprogramarTurno: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [turno, setTurno] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState("")
  const [horaSeleccionada, setHoraSeleccionada] = useState("")
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [fechasDisponibles, setFechasDisponibles] = useState<Date[]>([])
  const [reprogramando, setReprogramando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cargarTurno = async () => {
      try {
        const data = await patientPortalApi.obtenerTurno(Number(id))
        setTurno(data)

        const today = startOfDay(new Date())
        const dates: Date[] = []
        for (let i = 1; i <= 30; i++) {
          const date = addDays(today, i)
          dates.push(date)
        }
        setFechasDisponibles(dates)
      } catch (err) {
        console.error("Error al cargar turno:", err)
        setError("No se pudo cargar el turno")
      } finally {
        setLoading(false)
      }
    }
    cargarTurno()
  }, [id])

  useEffect(() => {
    const cargarHorarios = async () => {
      if (!fechaSeleccionada || !turno?.profesional_id) return

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/profesionales/${turno.profesional_id}/horarios?fecha=${fechaSeleccionada}`
        )
        if (response.ok) {
          const data = await response.json()
          setHorariosDisponibles(data.horarios || [])
        } else {
          setHorariosDisponibles([])
        }
      } catch (err) {
        console.error("Error al cargar horarios:", err)
        setHorariosDisponibles([])
      }
    }
    cargarHorarios()
  }, [fechaSeleccionada, turno])

  const handleReprogramar = async () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      setError("Por favor seleccion fecha y horario")
      return
    }

    setReprogramando(true)
    setError("")

    try {
      const horaFin = incrementTime(horaSeleccionada, 30)
      await patientPortalApi.reprogramarTurno(Number(id), fechaSeleccionada, horaSeleccionada, horaFin)
      setCompletado(true)
    } catch (err: any) {
      setError(err.message || "Error al reprogramar el turno")
    } finally {
      setReprogramando(false)
    }
  }

  const incrementTime = (time: string, minutes: number) => {
    const [h, m] = time.split(":").map(Number)
    const totalMinutes = h * 60 + m + minutes
    const newH = Math.floor(totalMinutes / 60)
    const newM = totalMinutes % 60
    return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    } catch {
      return fecha
    }
  }

  const formatDateDisplay = (date: Date) => {
    return format(date, "EEE d 'de' MMM", { locale: es })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{ color: dentalColors.primary }}>Cargando...</div>
      </div>
    )
  }

  if (completado) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#10B98120" }}
        >
          <CheckCircle size={40} style={{ color: "#10B981" }} />
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: dentalColors.gray800 }}>
          Turno Reprogramado
        </h2>
        <p className="mb-8" style={{ color: dentalColors.gray600 }}>
          Tu turno ha sido reprogramado exitosamente. Te enviamos un email de confirmacion.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to={`/paciente/turnos/${id}`}
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: dentalColors.primary }}
          >
            Ver Turno
          </Link>
          <Link
            to="/paciente/turnos"
            className="px-6 py-3 rounded-lg font-medium border"
            style={{ borderColor: dentalColors.gray300, color: dentalColors.gray700 }}
          >
            Ver Mis Turnos
          </Link>
        </div>
      </div>
    )
  }

  if (!turno) return null

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/paciente/turnos/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={24} style={{ color: dentalColors.gray600 }} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: dentalColors.gray800 }}>
          Reprogramar Turno
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#FEF3C720" }}>
          <p className="text-sm font-medium mb-2" style={{ color: "#92400E" }}>
            Fecha actual del turno
          </p>
          <p className="font-medium" style={{ color: "#78350F" }}>
            {formatearFecha(turno.fecha)} - {turno.hora_inicio}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: dentalColors.gray700 }}>
              Seleccionar Nueva Fecha
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {fechasDisponibles.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd")
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setFechaSeleccionada(dateStr)
                      setHoraSeleccionada("")
                    }}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      fechaSeleccionada === dateStr
                        ? "text-white"
                        : "hover:bg-gray-100"
                    }`}
                    style={
                      fechaSeleccionada === dateStr
                        ? { backgroundColor: dentalColors.primary }
                        : { backgroundColor: dentalColors.gray50 }
                    }
                  >
                    <div className="text-xs">{formatDateDisplay(date).split(" ")[0]}</div>
                    <div className="font-medium">{format(date, "d")}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {fechaSeleccionada && (
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: dentalColors.gray700 }}>
                Seleccionar Horario
              </label>
              {horariosDisponibles.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {horariosDisponibles.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => setHoraSeleccionada(hora)}
                      className={`p-3 rounded-lg text-center font-medium transition-colors ${
                        horaSeleccionada === hora
                          ? "text-white"
                          : "hover:bg-gray-100"
                      }`}
                      style={
                        horaSeleccionada === hora
                          ? { backgroundColor: dentalColors.primary }
                          : { backgroundColor: dentalColors.gray50 }
                      }
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4" style={{ color: dentalColors.gray600 }}>
                  No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleReprogramar}
            disabled={!fechaSeleccionada || !horaSeleccionada || reprogramando}
            className="w-full px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: dentalColors.primary }}
          >
            {reprogramando ? "Reprogramando..." : "Confirmar Reprogramacion"}
          </button>
        </div>
      </div>
    </div>
  )
}
