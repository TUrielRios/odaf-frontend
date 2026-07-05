"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Plus, Edit, Trash2, Calendar, X, Pill } from "lucide-react"
import { prescripcionesApi } from "../../api"
import type { Prescripcion, CrearPrescripcionData } from "../../types"
import { hoyLocal } from "../../lib/fechas"

interface PrescriptionsSectionProps {
  pacienteId: string | number
}

export const PrescriptionsSection: React.FC<PrescriptionsSectionProps> = ({ pacienteId }) => {
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view")
  const [selectedPrescripcion, setSelectedPrescripcion] = useState<Prescripcion | null>(null)
  const [formData, setFormData] = useState<Partial<CrearPrescripcionData>>({})

  useEffect(() => {
    fetchPrescripciones()
  }, [pacienteId])

  const fetchPrescripciones = async () => {
    try {
      setLoading(true)
      const data = await prescripcionesApi.listar(pacienteId)
      setPrescripciones(data)
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      paciente_id: String(pacienteId),
      fecha: hoyLocal(),
    })
    setModalMode("create")
    setShowModal(true)
  }

  const handleEdit = (prescripcion: Prescripcion) => {
    setSelectedPrescripcion(prescripcion)
    setFormData(prescripcion)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleView = (prescripcion: Prescripcion) => {
    setSelectedPrescripcion(prescripcion)
    setModalMode("view")
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar esta prescripción?")) {
      try {
        await prescripcionesApi.eliminar(id)
        fetchPrescripciones()
      } catch (error) {
        console.error("Error deleting prescription:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (modalMode === "create") {
        await prescripcionesApi.crear(formData as CrearPrescripcionData)
      } else if (modalMode === "edit" && selectedPrescripcion) {
        await prescripcionesApi.actualizar(selectedPrescripcion.id, formData)
      }
      setShowModal(false)
      fetchPrescripciones()
    } catch (error) {
      console.error("Error saving prescription:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando prescripciones...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Prescripciones</h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Prescripción
        </Button>
      </div>

      {prescripciones.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Pill className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No hay prescripciones registradas</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4 bg-transparent">
            Crear primera prescripción
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescripciones.map((prescripcion) => (
            <Card key={prescripcion.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1" onClick={() => handleView(prescripcion)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(prescripcion.fecha).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{prescripcion.medicamento}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Dosis:</span> {prescripcion.dosis}
                    </div>
                    <div>
                      <span className="font-medium">Frecuencia:</span> {prescripcion.frecuencia}
                    </div>
                    <div>
                      <span className="font-medium">Duración:</span> {prescripcion.duracion}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(prescripcion)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(prescripcion.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "view"
                  ? "Ver Prescripción"
                  : modalMode === "create"
                    ? "Nueva Prescripción"
                    : "Editar Prescripción"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === "view" && selectedPrescripcion ? (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-medium">{new Date(selectedPrescripcion.fecha).toLocaleDateString("es-ES")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Medicamento</p>
                  <p className="font-medium">{selectedPrescripcion.medicamento}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Dosis</p>
                    <p className="text-sm">{selectedPrescripcion.dosis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Frecuencia</p>
                    <p className="text-sm">{selectedPrescripcion.frecuencia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duración</p>
                    <p className="text-sm">{selectedPrescripcion.duracion}</p>
                  </div>
                </div>
                {selectedPrescripcion.indicaciones && (
                  <div>
                    <p className="text-xs text-gray-500">Indicaciones</p>
                    <p className="text-sm">{selectedPrescripcion.indicaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha || ""}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento *</label>
                  <input
                    type="text"
                    required
                    value={formData.medicamento || ""}
                    onChange={(e) => setFormData({ ...formData, medicamento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Ibuprofeno 600mg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosis *</label>
                    <input
                      type="text"
                      required
                      value={formData.dosis || ""}
                      onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 1 comprimido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia *</label>
                    <input
                      type="text"
                      required
                      value={formData.frecuencia || ""}
                      onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Cada 8 horas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración *</label>
                    <input
                      type="text"
                      required
                      value={formData.duracion || ""}
                      onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 7 días"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones</label>
                  <textarea
                    rows={3}
                    value={formData.indicaciones || ""}
                    onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Instrucciones adicionales para el paciente"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{modalMode === "create" ? "Crear Prescripción" : "Guardar Cambios"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
