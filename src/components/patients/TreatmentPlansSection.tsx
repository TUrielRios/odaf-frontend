"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import {
  Plus, Edit, Trash2, Calendar, X, ClipboardList, DollarSign,
  ChevronDown, ChevronUp, Check, User,
} from "lucide-react"
import { planesTratamientoApi, procedimientosApi, profesionalesApi, pacientesApi } from "../../api"
import type { PlanTratamiento, CrearPlanTratamientoData, TratamientoPlan, Procedimiento, Profesional, Paciente } from "../../types"
import { dentalColors } from "../../config/colors"
import { getDienteImageSrc, esDienteSuperior } from "../../utils/dienteImages"

// ─── Constantes ────────────────────────────────────────────────────────────────

const NOMENCLADORES = [
  "Pieza",
  "Maxilar superior",
  "Maxilar inferior",
  "Maxilar superior e inferior",
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Sector 5",
  "Sector 6",
]

const DIENTES_SUPERIORES = [
  "1.8", "1.7", "1.6", "1.5", "1.4", "1.3", "1.2", "1.1",
  "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8",
]

const DIENTES_INFERIORES = [
  "4.8", "4.7", "4.6", "4.5", "4.4", "4.3", "4.2", "4.1",
  "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8",
]

const SUPERFICIES = ["oclusal", "vestibular", "lingual", "mesial", "distal"] as const

const ESTADOS_TRATAMIENTO = [
  { value: "Pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "Comenzado", label: "Comenzado", color: "bg-blue-100 text-blue-800" },
  { value: "Cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
  { value: "Terminado", label: "Terminado", color: "bg-green-100 text-green-800" },
]

// ─── Componente: Mini Diente Visual (5 cuadritos) ──────────────────────────────

interface MiniDienteProps {
  superficies: Record<string, string>
  piezaNumero?: string | null
  onSuperficieClick?: (superficie: string) => void
  readOnly?: boolean
  size?: "sm" | "md"
}

const MiniDiente: React.FC<MiniDienteProps> = ({
  superficies,
  piezaNumero,
  onSuperficieClick,
  readOnly = false,
  size = "md",
}) => {
  const [imgError, setImgError] = useState(false)
  const isSuperior = piezaNumero ? esDienteSuperior(piezaNumero) : true
  const imageSrc = piezaNumero ? getDienteImageSrc(piezaNumero) : ""

  const dims = size === "sm" ? "w-[30px] h-[30px]" : "w-[48px] h-[48px]"
  const imgDims = size === "sm" ? "w-8 h-10" : "w-10 h-14"

  const getColor = (superficie: string): string => {
    const estado = superficies[superficie]
    if (!estado || estado === "sano") return "#F3F4F6"
    if (estado === "mal_estado") return "#000000" // Negro en vez de azul
    if (estado === "buen_estado") return "#DC2626"
    return "#9CA3AF"
  }

  const getBorder = (superficie: string): string => {
    const estado = superficies[superficie]
    if (!estado || estado === "sano") return "#D1D5DB"
    if (estado === "mal_estado") return "#000000" // Negro en vez de azul
    if (estado === "buen_estado") return "#B91C1C"
    return "#6B7280"
  }

  const renderSquare = (superficie: string) => (
    <div
      key={superficie}
      onClick={() => !readOnly && onSuperficieClick?.(superficie)}
      style={{ backgroundColor: getColor(superficie), borderColor: getBorder(superficie) }}
      className={`border transition-all ${!readOnly ? "cursor-pointer hover:opacity-75 hover:scale-110" : ""}`}
      title={superficie}
    />
  )

  const renderSurfaceGrid = () => (
    <div className={`grid grid-cols-3 grid-rows-3 gap-px ${dims}`}>
      <div className="bg-transparent" />
      {renderSquare("vestibular")}
      <div className="bg-transparent" />
      {renderSquare("mesial")}
      {renderSquare("oclusal")}
      {renderSquare("distal")}
      <div className="bg-transparent" />
      {renderSquare("lingual")}
      <div className="bg-transparent" />
    </div>
  )

  const renderToothImage = () => {
    if (!piezaNumero) return null
    return (
      <div className={`${imgDims} relative flex items-center justify-center`}>
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={`Diente ${piezaNumero}`}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg viewBox="0 0 48 64" className="w-full h-full opacity-60">
            {isSuperior ? (
              <>
                <path d="M 16 28 L 24 8 L 32 28 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
                <rect x="12" y="28" width="24" height="28" rx="4" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <rect x="12" y="8" width="24" height="28" rx="4" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M 16 36 L 24 56 L 32 36 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
              </>
            )}
          </svg>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1 p-1 bg-white rounded border border-gray-100 shadow-sm">
      {isSuperior ? (
        <>
          {renderToothImage()}
          {renderSurfaceGrid()}
        </>
      ) : (
        <>
          {renderSurfaceGrid()}
          {renderToothImage()}
        </>
      )}
    </div>
  )
}

// ─── Componente Principal ──────────────────────────────────────────────────────

interface TreatmentPlansSectionProps {
  pacienteId: string | number
}

export const TreatmentPlansSection: React.FC<TreatmentPlansSectionProps> = ({ pacienteId }) => {
  // Estado original (planes)
  const [planes, setPlanes] = useState<PlanTratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view")
  const [selectedPlan, setSelectedPlan] = useState<PlanTratamiento | null>(null)
  const [formData, setFormData] = useState<Partial<CrearPlanTratamientoData>>({})

  // Estado nuevo (tratamientos dentro de un plan)
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null)
  const [showTratamientoModal, setShowTratamientoModal] = useState(false)
  const [editingTratamiento, setEditingTratamiento] = useState<TratamientoPlan | null>(null)
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [savingTratamiento, setSavingTratamiento] = useState(false)

  // Form data para agregar tratamiento
  const [tratamientoForm, setTratamientoForm] = useState({
    procedimiento_id: 0,
    nomenclador: "",
    fecha_inicio: new Date().toISOString().split("T")[0],
    pieza_numero: "",
    pieza_superficies: {} as Record<string, string>,
  })

  // Form data para editar tratamiento (estado + profesional)
  const [editForm, setEditForm] = useState({
    estado: "" as string,
    profesional_id: null as number | null,
    autorizado: false,
  })

  const [paciente, setPaciente] = useState<Paciente | null>(null)

  useEffect(() => {
    fetchPlanes()
    fetchPaciente()
  }, [pacienteId])

  const fetchPaciente = async () => {
    try {
      const data = await pacientesApi.obtener(String(pacienteId))
      setPaciente(data)
    } catch (error) {
      console.error("Error fetching patient details:", error)
    }
  }

  const fetchPlanes = async () => {
    try {
      setLoading(true)
      const data = await planesTratamientoApi.listar(pacienteId)
      setPlanes(data)
    } catch (error) {
      console.error("Error fetching treatment plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const obtenerPreciosVista = (procId: number) => {
    const p = procedimientos.find((item) => item.id === procId)
    if (!p) return null

    const obraSocialId = paciente?.obra_social_id
    let precioPaciente = parseFloat(p.precio_ars as any) || 0
    let coberturaObraSocial = 0
    let obraSocialNombre = paciente?.obraSocial?.nombre || "Particular"

    if (obraSocialId && p.preciosObraSocial) {
      const precioOS = p.preciosObraSocial.find(
        (pos) => pos.obra_social_id === obraSocialId
      )
      if (precioOS) {
        coberturaObraSocial = parseFloat(precioOS.cobertura as any) || 0
        if (!precioOS.usar_precio_particular && precioOS.precio_paciente !== null) {
          precioPaciente = parseFloat(precioOS.precio_paciente as any) || 0
        }
      }
    }

    return {
      precioPaciente,
      coberturaObraSocial,
      obraSocialNombre,
      particularPrice: parseFloat(p.precio_ars as any) || 0,
      hasObraSocial: !!obraSocialId
    }
  }

  const loadProcedimientos = async () => {
    try {
      const data = await procedimientosApi.listar()
      setProcedimientos(data)
    } catch (error) {
      console.error("Error loading procedimientos:", error)
    }
  }

  const loadProfesionales = async () => {
    try {
      const data = await profesionalesApi.listar({ limit: 100 })
      setProfesionales(data.data || [])
    } catch (error) {
      console.error("Error loading profesionales:", error)
    }
  }

  // ─── Handlers de Plan (preservados del original) ──────────────────────────

  const handleCreate = () => {
    setFormData({
      paciente_id: String(pacienteId),
      descripcion: "",
      observaciones: "",
    })
    setModalMode("create")
    setShowModal(true)
  }

  const handleEdit = (plan: PlanTratamiento) => {
    setSelectedPlan(plan)
    setFormData({
      paciente_id: plan.paciente_id,
      descripcion: plan.descripcion,
      observaciones: plan.observaciones || "",
    })
    setModalMode("edit")
    setShowModal(true)
  }

  // const handleView = (plan: PlanTratamiento) => {
  //   setSelectedPlan(plan)
  //   setModalMode("view")
  //   setShowModal(true)
  // }

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este plan de tratamiento?")) {
      try {
        await planesTratamientoApi.eliminar(id as any)
        fetchPlanes()
      } catch (error) {
        console.error("Error deleting treatment plan:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion?.trim()) {
      alert("El nombre del plan es requerido.")
      return
    }

    try {
      if (modalMode === "create") {
        await planesTratamientoApi.crear(formData as CrearPlanTratamientoData)
      } else if (modalMode === "edit" && selectedPlan) {
        await planesTratamientoApi.actualizar(selectedPlan.id, formData)
      }
      setShowModal(false)
      fetchPlanes()
    } catch (error: any) {
      console.error("Error saving treatment plan:", error)
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.error || "Error al guardar el plan de tratamiento. Por favor, intente nuevamente."
      alert(errorMsg)
    }
  }

  // ─── Handlers de Tratamiento (nuevos) ─────────────────────────────────────

  const handleToggleExpand = (planId: number) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId)
  }

  const handleOpenTratamientoModal = async (plan: PlanTratamiento) => {
    setSelectedPlan(plan)
    setTratamientoForm({
      procedimiento_id: 0,
      nomenclador: "",
      fecha_inicio: new Date().toISOString().split("T")[0],
      pieza_numero: "",
      pieza_superficies: {},
    })
    await Promise.all([loadProcedimientos(), loadProfesionales()])
    setShowTratamientoModal(true)
  }

  const handleSaveTratamiento = async () => {
    if (!selectedPlan) return
    if (!tratamientoForm.procedimiento_id || !tratamientoForm.nomenclador) {
      alert("Seleccioná un procedimiento y un nomenclador dental.")
      return
    }
    if (tratamientoForm.nomenclador === "Pieza" && !tratamientoForm.pieza_numero) {
      alert("Seleccioná el número de pieza.")
      return
    }

    try {
      setSavingTratamiento(true)
      await planesTratamientoApi.agregarTratamiento(selectedPlan.id, {
        procedimiento_id: tratamientoForm.procedimiento_id,
        nomenclador: tratamientoForm.nomenclador,
        fecha_inicio: tratamientoForm.fecha_inicio,
        pieza_numero: tratamientoForm.nomenclador === "Pieza" ? tratamientoForm.pieza_numero : undefined,
        pieza_superficies: tratamientoForm.nomenclador === "Pieza" ? tratamientoForm.pieza_superficies : undefined,
      })
      setShowTratamientoModal(false)
      fetchPlanes()
    } catch (error: any) {
      console.error("Error adding treatment:", error)
      alert(error.response?.data?.error || "Error al agregar el tratamiento.")
    } finally {
      setSavingTratamiento(false)
    }
  }

  const handleEditTratamiento = async (plan: PlanTratamiento, tratamiento: TratamientoPlan) => {
    setSelectedPlan(plan)
    setEditingTratamiento(tratamiento)
    setEditForm({
      estado: tratamiento.estado,
      profesional_id: tratamiento.profesional_id || null,
      autorizado: tratamiento.autorizado,
    })
    await loadProfesionales()
  }

  const handleSaveEditTratamiento = async () => {
    if (!selectedPlan || !editingTratamiento) return

    try {
      setSavingTratamiento(true)
      await planesTratamientoApi.actualizarTratamiento(
        selectedPlan.id,
        editingTratamiento.id,
        editForm as any
      )
      setEditingTratamiento(null)
      fetchPlanes()
    } catch (error: any) {
      console.error("Error updating treatment:", error)
      alert(error.response?.data?.error || "Error al actualizar el tratamiento.")
    } finally {
      setSavingTratamiento(false)
    }
  }

  const handleDeleteTratamiento = async (plan: PlanTratamiento, tratamientoId: number) => {
    if (window.confirm("¿Estás seguro de eliminar este tratamiento?")) {
      try {
        await planesTratamientoApi.eliminarTratamiento(plan.id, tratamientoId)
        fetchPlanes()
      } catch (error) {
        console.error("Error deleting treatment:", error)
      }
    }
  }

  const handleSuperficieClick = (superficie: string) => {
    setTratamientoForm((prev) => {
      const current = prev.pieza_superficies[superficie]
      const next = current === "mal_estado" ? "sano" : "mal_estado"
      return {
        ...prev,
        pieza_superficies: { ...prev.pieza_superficies, [superficie]: next },
      }
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Planificado":
        return "bg-blue-100 text-blue-800"
      case "En_Progreso":
        return "bg-yellow-100 text-yellow-800"
      case "Completado":
        return "bg-green-100 text-green-800"
      case "Cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTratamientoEstadoBadge = (estado: string) => {
    const found = ESTADOS_TRATAMIENTO.find((e) => e.value === estado)
    return found?.color || "bg-gray-100 text-gray-800"
  }

  const getTratamientos = (plan: PlanTratamiento): TratamientoPlan[] => {
    return plan.tratamientosItems || plan.tratamientos || []
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando planes de tratamiento...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Planes de Tratamiento</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {planes.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay planes de tratamiento registrados</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4 bg-transparent">
            Crear primer plan
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {planes.map((plan) => {
            const tratamientos = getTratamientos(plan)
            const isExpanded = expandedPlanId === plan.id

            return (
              <Card key={plan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Cabecera del plan */}
                <div className="p-4 flex justify-between items-start">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleToggleExpand(plan.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(plan.estado)}`}
                      >
                        {plan.estado.replace("_", " ")}
                      </span>
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(plan.fecha_inicio).toLocaleDateString("es-ES")}
                        {plan.fecha_fin && ` - ${new Date(plan.fecha_fin).toLocaleDateString("es-ES")}`}
                      </span>
                      {tratamientos.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {tratamientos.length} tratamiento{tratamientos.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-1">{plan.descripcion}</p>
                    {plan.costo_estimado && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>${Number(plan.costo_estimado).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleToggleExpand(plan.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id as any)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Sección expandida: Tratamientos */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 px-4 py-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Tratamientos del Plan</h4>
                      <Button
                        size="sm"
                        onClick={() => handleOpenTratamientoModal(plan)}
                        style={{ backgroundColor: dentalColors.primary }}
                        className="text-white hover:opacity-90 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Tratamiento
                      </Button>
                    </div>

                    {tratamientos.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No hay tratamientos cargados en este plan.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Procedimiento
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Nomenclatura
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Inicio
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Estado
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                $ Paciente
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Autorizado
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Cobertura OS
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {tratamientos.map((t) => (
                              <tr
                                key={t.id}
                                className="hover:bg-blue-50 transition-colors cursor-pointer"
                                onClick={() => handleEditTratamiento(plan, t)}
                              >
                                <td className="px-3 py-2.5 font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {t.nomenclador === "Pieza" && t.pieza_superficies && (
                                      <MiniDiente
                                        superficies={t.pieza_superficies}
                                        piezaNumero={t.pieza_numero}
                                        readOnly
                                        size="sm"
                                      />
                                    )}
                                    <span>{t.procedimiento?.nombre || `Proc. #${t.procedimiento_id}`}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-gray-600">
                                  {t.nomenclador}
                                  {t.pieza_numero && (
                                    <span className="ml-1 text-xs font-semibold text-gray-800">
                                      ({t.pieza_numero})
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600">
                                  {new Date(t.fecha_inicio).toLocaleDateString("es-ES")}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getTratamientoEstadoBadge(t.estado)}`}
                                  >
                                    {t.estado}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                                  ${Number(t.precio_paciente).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {t.autorizado ? (
                                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium" style={{ color: dentalColors.primary }}>
                                  ${Number(t.cobertura_obra_social).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleDeleteTratamiento(plan, t.id)}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Eliminar tratamiento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Modal: Crear/Editar Plan (original preservado) ──────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "view"
                  ? "Ver Plan de Tratamiento"
                  : modalMode === "create"
                    ? "Nuevo Plan de Tratamiento"
                    : "Editar Plan de Tratamiento"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === "view" && selectedPlan ? (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(selectedPlan.estado)}`}
                  >
                    {selectedPlan.estado.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Fecha de Inicio</p>
                    <p className="font-medium">{new Date(selectedPlan.fecha_inicio).toLocaleDateString("es-ES")}</p>
                  </div>
                  {selectedPlan.fecha_fin && (
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Fin</p>
                      <p className="font-medium">{new Date(selectedPlan.fecha_fin).toLocaleDateString("es-ES")}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Descripción</p>
                  <p className="text-sm">{selectedPlan.descripcion}</p>
                </div>
                {selectedPlan.costo_estimado && (
                  <div>
                    <p className="text-xs text-gray-500">Costo Estimado</p>
                    <p className="font-medium text-lg">${Number(selectedPlan.costo_estimado).toLocaleString()}</p>
                  </div>
                )}
                {selectedPlan.observaciones && (
                  <div>
                    <p className="text-xs text-gray-500">Observaciones</p>
                    <p className="text-sm">{selectedPlan.observaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan *</label>
                  <input
                    type="text"
                    required
                    value={formData.descripcion || ""}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Plan de Ortodoncia Inicial, Tratamiento de Conducto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    rows={3}
                    value={formData.observaciones || ""}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas u observaciones adicionales opcionales"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{modalMode === "create" ? "Crear Plan" : "Guardar Cambios"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Modal: Agregar Tratamiento ──────────────────────────────────── */}
      {showTratamientoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Tratamiento</h3>
              <button onClick={() => setShowTratamientoModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                <input
                  type="date"
                  value={tratamientoForm.fecha_inicio}
                  onChange={(e) => setTratamientoForm({ ...tratamientoForm, fecha_inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Procedimiento */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento *</label>
                <select
                  value={tratamientoForm.procedimiento_id}
                  onChange={(e) =>
                    setTratamientoForm({ ...tratamientoForm, procedimiento_id: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>-- Seleccionar procedimiento --</option>
                  {procedimientos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>

                {/* Resumen de arancel según Obra Social */}
                {tratamientoForm.procedimiento_id > 0 && (() => {
                  const precios = obtenerPreciosVista(tratamientoForm.procedimiento_id)
                  if (!precios) return null
                  return (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-sm shadow-sm transition-all duration-200">
                      <div className="flex justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        <span>Resumen de Aranceles</span>
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase text-[10px]">
                          {precios.obraSocialNombre}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {precios.hasObraSocial ? (
                          <>
                            <div className="flex justify-between py-1.5">
                              <span className="text-gray-600">Cobertura Obra Social:</span>
                              <span className="font-semibold text-green-600">
                                ${precios.coberturaObraSocial.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-gray-600">Copago Paciente:</span>
                              <span className="font-bold text-gray-900">
                                ${precios.precioPaciente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between py-1.5">
                            <span className="text-gray-600">Precio Particular:</span>
                            <span className="font-bold text-gray-900">
                              ${precios.particularPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Nomenclador Dental */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomenclador Dental *</label>
                <select
                  value={tratamientoForm.nomenclador}
                  onChange={(e) =>
                    setTratamientoForm({
                      ...tratamientoForm,
                      nomenclador: e.target.value,
                      pieza_numero: "",
                      pieza_superficies: {},
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar nomenclador --</option>
                  {NOMENCLADORES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Si es tipo Pieza: selector de pieza + mini diente */}
              {tratamientoForm.nomenclador === "Pieza" && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Pieza *</label>
                    <select
                      value={tratamientoForm.pieza_numero}
                      onChange={(e) =>
                        setTratamientoForm({ ...tratamientoForm, pieza_numero: e.target.value, pieza_superficies: {} })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Seleccionar pieza --</option>
                      <optgroup label="Maxilar Superior">
                        {DIENTES_SUPERIORES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Maxilar Inferior">
                        {DIENTES_INFERIORES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {tratamientoForm.pieza_numero && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marcar superficies afectadas (click para marcar/desmarcar)
                      </label>
                      <div className="flex items-center gap-4">
                        <MiniDiente
                          superficies={tratamientoForm.pieza_superficies}
                          piezaNumero={tratamientoForm.pieza_numero}
                          onSuperficieClick={handleSuperficieClick}
                          size="md"
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="font-semibold text-gray-700">Pieza {tratamientoForm.pieza_numero}</p>
                          {SUPERFICIES.map((s) => (
                            <div key={s} className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-sm border"
                                style={{
                                  backgroundColor:
                                    tratamientoForm.pieza_superficies[s] === "mal_estado" ? "#000000" : "#F3F4F6",
                                  borderColor:
                                    tratamientoForm.pieza_superficies[s] === "mal_estado" ? "#000000" : "#D1D5DB",
                                }}
                              />
                              <span className="capitalize">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowTratamientoModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTratamiento} disabled={savingTratamiento}>
                  {savingTratamiento ? "Guardando..." : "Agregar Tratamiento"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Editar Tratamiento (estado, profesional, autorizado) ─ */}
      {editingTratamiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Editar Tratamiento</h3>
              <button onClick={() => setEditingTratamiento(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info del tratamiento */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {editingTratamiento.procedimiento?.nombre || `Procedimiento #${editingTratamiento.procedimiento_id}`}
                </p>
                <p className="text-xs text-gray-500">
                  {editingTratamiento.nomenclador}
                  {editingTratamiento.pieza_numero && ` — Pieza ${editingTratamiento.pieza_numero}`}
                </p>
                {editingTratamiento.nomenclador === "Pieza" && editingTratamiento.pieza_superficies && (
                  <div className="pt-2">
                    <MiniDiente
                      superficies={editingTratamiento.pieza_superficies}
                      piezaNumero={editingTratamiento.pieza_numero}
                      readOnly
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ESTADOS_TRATAMIENTO.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
                {editForm.estado === "Terminado" && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Al marcar como terminado se generará una prestación automáticamente para liquidación.
                  </p>
                )}
              </div>

              {/* Profesional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-3.5 w-3.5 inline mr-1" />
                  Asignar Profesional
                </label>
                <select
                  value={editForm.profesional_id || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, profesional_id: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sin asignar --</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apellido}, {p.nombre} — {p.especialidad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Autorizado toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.autorizado}
                    onChange={(e) => setEditForm({ ...editForm, autorizado: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                    style={{ accentColor: dentalColors.primary }}
                  />
                  <span className="text-sm font-medium text-gray-700">Autorizado por Obra Social</span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingTratamiento(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEditTratamiento} disabled={savingTratamiento}>
                  {savingTratamiento ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
