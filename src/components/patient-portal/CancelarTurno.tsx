import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { patientPortalApi } from "../../api/patient-portal"
import { dentalColors } from "../../config/colors"
import { Calendar, Clock, User, AlertTriangle, CheckCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export const CancelarTurno: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [turno, setTurno] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cargarTurno = async () => {
      try {
        const data = await patientPortalApi.obtenerTurno(Number(id))
        setTurno(data)
      } catch (error) {
        console.error("Error al cargar turno:", error)
        setError("No se pudo cargar el turno")
      } finally {
        setLoading(false)
      }
    }
    cargarTurno()
  }, [id])

  const handleCancelar = async () => {
    setCancelando(true)
    setError("")

    try {
      await patientPortalApi.cancelarTurno(Number(id))
      setCompletado(true)
    } catch (err: any) {
      setError(err.message || "Error al cancelar el turno")
    } finally {
      setCancelando(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    } catch {
      return fecha
    }
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
          Turno Cancelado
        </h2>
        <p className="mb-8" style={{ color: dentalColors.gray600 }}>
          Tu turno ha sido cancelado exitosamente. Te enviamos un email de confirmacion.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/paciente/turnos"
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: dentalColors.primary }}
          >
            Ver Mis Turnos
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-lg font-medium border"
            style={{ borderColor: dentalColors.gray300, color: dentalColors.gray700 }}
          >
            Reservar Nuevo Turno
          </Link>
        </div>
      </div>
    )
  }

  if (!turno) return null

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#EF444420" }}
        >
          <AlertTriangle size={32} style={{ color: "#EF4444" }} />
        </div>

        <h1 className="text-xl font-bold text-center mb-2" style={{ color: dentalColors.gray800 }}>
          Cancelar Turno
        </h1>
        <p className="text-center mb-6" style={{ color: dentalColors.gray600 }}>
          Estas seguro de que deseas cancelar este turno?
        </p>

        <div className="space-y-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: dentalColors.gray50 }}>
          <div className="flex items-center gap-3">
            <Calendar size={18} style={{ color: dentalColors.primary }} />
            <span>{formatearFecha(turno.fecha)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={18} style={{ color: dentalColors.primary }} />
            <span>{turno.hora_inicio} - {turno.hora_fin}</span>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} style={{ color: dentalColors.primary }} />
            <span>
              {turno.profesional?.nombre} {turno.profesional?.apellido}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            className="w-full px-6 py-3 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
          >
            {cancelando ? "Cancelando..." : "Confirmar Cancelacion"}
          </button>
          <Link
            to={`/paciente/turnos/${id}`}
            className="w-full text-center px-6 py-3 rounded-lg font-medium border"
            style={{ borderColor: dentalColors.gray300, color: dentalColors.gray700 }}
          >
            Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
