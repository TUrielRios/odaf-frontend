import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { patientPortalApi } from "../../api/patient-portal"
import { dentalColors } from "../../config/colors"
import { Calendar, Clock, User, FileText, ArrowLeft } from "lucide-react"
import { format, parseISO, isAfter } from "date-fns"
import { es } from "date-fns/locale"

export const DetalleTurno: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [turno, setTurno] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarTurno = async () => {
      try {
        const data = await patientPortalApi.obtenerTurno(Number(id))
        setTurno(data)
      } catch (error) {
        console.error("Error al cargar turno:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarTurno()
  }, [id])

  const puedeAccionar = () => {
    if (!turno) return false
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaTurno = parseISO(turno.fecha)
    return isAfter(fechaTurno, hoy) && turno.estado !== "Cancelado" && turno.estado !== "Atendido"
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
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
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{ color: dentalColors.primary }}>Cargando...</div>
      </div>
    )
  }

  if (!turno) {
    return (
      <div className="text-center py-12">
        <p className="text-lg" style={{ color: dentalColors.gray600 }}>Turno no encontrado</p>
        <Link to="/paciente/turnos" className="mt-4 inline-block" style={{ color: dentalColors.primary }}>
          Volver a Mis Turnos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/paciente/turnos"
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={24} style={{ color: dentalColors.gray600 }} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: dentalColors.gray800 }}>
          Detalle del Turno
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
            {turno.estado}
          </span>
        </div>

        <div className="grid gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${dentalColors.primary}15` }}>
              <Calendar size={24} style={{ color: dentalColors.primary }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: dentalColors.gray600 }}>Fecha</p>
              <p className="text-lg font-medium" style={{ color: dentalColors.gray800 }}>
                {formatearFecha(turno.fecha)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${dentalColors.primary}15` }}>
              <Clock size={24} style={{ color: dentalColors.primary }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: dentalColors.gray600 }}>Horario</p>
              <p className="text-lg font-medium" style={{ color: dentalColors.gray800 }}>
                {turno.hora_inicio} - {turno.hora_fin}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${dentalColors.primary}15` }}>
              <User size={24} style={{ color: dentalColors.primary }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: dentalColors.gray600 }}>Profesional</p>
              <p className="text-lg font-medium" style={{ color: dentalColors.gray800 }}>
                {turno.profesional?.nombre} {turno.profesional?.apellido}
              </p>
              {turno.profesional?.especialidad && (
                <p className="text-sm" style={{ color: dentalColors.gray600 }}>
                  {turno.profesional.especialidad}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${dentalColors.primary}15` }}>
              <FileText size={24} style={{ color: dentalColors.primary }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: dentalColors.gray600 }}>Servicio</p>
              <p className="text-lg font-medium" style={{ color: dentalColors.gray800 }}>
                {turno.servicio?.nombre}
              </p>
            </div>
          </div>

          {turno.observaciones && (
            <div className="pt-4 border-t" style={{ borderColor: dentalColors.gray200 }}>
              <p className="text-sm font-medium mb-2" style={{ color: dentalColors.gray600 }}>
                Observaciones
              </p>
              <p style={{ color: dentalColors.gray800 }}>{turno.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {puedeAccionar() && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to={`/paciente/turnos/${turno.id}/reprogramar`}
            className="flex-1 text-center px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: dentalColors.primary }}
          >
            Reprogramar Turno
          </Link>
          <Link
            to={`/paciente/turnos/${turno.id}/cancelar`}
            className="flex-1 text-center px-6 py-3 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600"
          >
            Cancelar Turno
          </Link>
        </div>
      )}
    </div>
  )
}
