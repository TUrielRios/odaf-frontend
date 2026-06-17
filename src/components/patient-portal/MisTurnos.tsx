import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { patientPortalApi } from "../../api/patient-portal"
import { dentalColors } from "../../config/colors"
import { Calendar, Clock, User } from "lucide-react"
import { format, parseISO, isAfter } from "date-fns"
import { es } from "date-fns/locale"

export const MisTurnos: React.FC = () => {
  const [turnos, setTurnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | "proximos" | "pasados" | "cancelados">("todos")

  useEffect(() => {
    const cargarTurnos = async () => {
      try {
        const data = await patientPortalApi.obtenerMisTurnos()
        setTurnos(data)
      } catch (error) {
        console.error("Error al cargar turnos:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarTurnos()
  }, [])

  const filtrarTurnos = () => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return turnos.filter((turno) => {
      const fechaTurno = parseISO(turno.fecha)

      switch (filtro) {
        case "proximos":
          return isAfter(fechaTurno, hoy) && turno.estado !== "Cancelado"
        case "pasados":
          return !isAfter(fechaTurno, hoy) && turno.estado !== "Cancelado"
        case "cancelados":
          return turno.estado === "Cancelado"
        default:
          return true
      }
    })
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "EEE d 'de' MMM yyyy", { locale: es })
    } catch {
      return fecha
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmado":
      case "Confirmado por email":
      case "Confirmado por SMS":
      case "Confirmado por WhatsApp":
        return "bg-emerald-100 text-emerald-700"
      case "Pendiente":
        return "bg-amber-100 text-amber-700"
      case "Cancelado":
        return "bg-red-100 text-red-700"
      case "Atendido":
        return "bg-blue-100 text-blue-700"
      case "Ausente":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const puedeAccionar = (turno: any) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaTurno = parseISO(turno.fecha)
    return isAfter(fechaTurno, hoy) && turno.estado !== "Cancelado" && turno.estado !== "Atendido"
  }

  const turnosFiltrados = filtrarTurnos()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{ color: dentalColors.primary }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: dentalColors.gray800 }}>
        Mis Turnos
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["todos", "proximos", "pasados", "cancelados"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filtro === f
                ? "text-white"
                : "bg-white"
            }`}
            style={filtro === f ? { backgroundColor: dentalColors.primary } : { color: dentalColors.gray700 }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {turnosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4" style={{ color: dentalColors.gray400 }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: dentalColors.gray700 }}>
            No hay turnos en esta categoria
          </h3>
          <Link
            to="/"
            className="inline-block mt-4 px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: dentalColors.primary }}
          >
            Reservar Turno
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {turnosFiltrados.map((turno) => (
            <div
              key={turno.id}
              className="bg-white rounded-xl shadow-md p-4 lg:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}
                    >
                      {turno.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} style={{ color: dentalColors.primary }} />
                      <span className="font-medium">{formatearFecha(turno.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} style={{ color: dentalColors.primary }} />
                      <span>{turno.hora_inicio} - {turno.hora_fin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={18} style={{ color: dentalColors.gray600 }} />
                      <span>
                        {turno.profesional?.nombre} {turno.profesional?.apellido}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: dentalColors.gray600 }}>
                      {turno.servicio?.nombre}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/paciente/turnos/${turno.id}`}
                    className="px-4 py-2 rounded-lg font-medium border"
                    style={{ borderColor: dentalColors.gray300, color: dentalColors.gray700 }}
                  >
                    Ver
                  </Link>
                  {puedeAccionar(turno) && (
                    <>
                      <Link
                        to={`/paciente/turnos/${turno.id}/reprogramar`}
                        className="px-4 py-2 rounded-lg font-medium text-white"
                        style={{ backgroundColor: dentalColors.primary }}
                      >
                        Reprogramar
                      </Link>
                      <Link
                        to={`/paciente/turnos/${turno.id}/cancelar`}
                        className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600"
                      >
                        Cancelar
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
