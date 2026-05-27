"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pill,
  Smile,
  File,
  Camera,
  Bell,
  Calendar,
} from "lucide-react"
import { pacientesApi, obrasSocialesApi } from "../../api"
import { apiClient } from "../../lib/api-client"
import type { Paciente, CrearPacienteData, ObraSocial } from "../../types"
import { ClinicalHistorySection } from "./ClinicalHistorySection"
import { OdontogramSection } from "./OdontogramSection"
import { PrescriptionsSection } from "./PrescriptionsSection"
import { TreatmentPlansSection } from "./TreatmentPlansSection"
import { FilesSection } from "./FilesSection"
import { CuentaCorrienteSection } from "./CuentaCorrienteSection"
import { RemindersSection } from "./RemindersSection"
import { TurnosSection } from "./TurnosSection"
import { PresupuestosSection } from "./PresupuestosSection"

type TabType = "info" | "historia" | "odontograma" | "prescripciones" | "tratamientos" | "archivos" | "cuenta_corriente" | "recordatorios" | "turnos" | "presupuestos"

interface PatientsViewProps {
  initialPatientId?: string | null
  onClearPatient?: () => void
}

export const PatientsView: React.FC<PatientsViewProps> = ({ initialPatientId, onClearPatient }) => {
  const [patients, setPatients] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "create" | "edit">("view")
  const [formData, setFormData] = useState<Partial<CrearPacienteData>>({})
  const [activeTab, setActiveTab] = useState<TabType>("info")
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

  useEffect(() => {
    fetchPatients()
    fetchObrasSociales()
  }, [currentPage, searchTerm, selectedMonth])

  useEffect(() => {
    if (initialPatientId) {
      handleFetchAndShowPatient(initialPatientId)
    }
  }, [initialPatientId])

  const handleFetchAndShowPatient = async (id: string) => {
    try {
      setLoading(true)
      const patient = await pacientesApi.obtener(id)
      if (patient) {
        setSelectedPatient(patient)
        setModalMode("view")
        setActiveTab("info")
        setShowModal(true)
      }
    } catch (error) {
      console.error("Error fetching initial patient:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchObrasSociales = async () => {
    try {
      const response = await obrasSocialesApi.listar()
      setObrasSociales(response || [])
    } catch (error) {
      console.error("Error fetching health insurances:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await pacientesApi.listar({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        mes_nacimiento: selectedMonth ? Number(selectedMonth) : undefined,
      })
      // La respuesta tiene la estructura { data: [...], pagination: {...} }
      setPatients(response?.data || [])
      setTotalPages(response?.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching patients:", error)
      setPatients([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePatient = () => {
    setFormData({
      condicion: "Activo",
      tipo_facturacion: "B",
    })
    setModalMode("create")
    setShowModal(true)
  }

  const handleEditPatient = (patient: Paciente) => {
    setSelectedPatient(patient)
    setFormData(patient)
    setModalMode("edit")
    setActiveTab("info")
    setShowModal(true)
  }

  const handleViewPatient = (patient: Paciente) => {
    setSelectedPatient(patient)
    setModalMode("view")
    setActiveTab("info")
    setShowModal(true)
  }

  const handleDeletePatient = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este paciente?")) {
      try {
        await pacientesApi.eliminar(id)
        fetchPatients()
      } catch (error) {
        console.error("Error deleting patient:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (modalMode === "create") {
        await pacientesApi.crear(formData as CrearPacienteData)
      } else if (modalMode === "edit" && selectedPatient) {
        await pacientesApi.actualizar(selectedPatient.id, formData)
      }
      setShowModal(false)
      fetchPatients()
    } catch (error) {
      console.error("Error saving patient:", error)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, patientId: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingPhoto(true)
      const formData = new FormData()
      formData.append("foto", file)
      const updated = await apiClient.put<Paciente>(`/pacientes/${patientId}/foto`, formData)
      if (selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient({ ...selectedPatient, foto_url: updated.foto_url })
      }
      fetchPatients()
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getPhotoUrl = (patient: Paciente) => {
    if (!patient.foto_url) return null
    // If it's an absolute URL (Cloudinary, etc.), use as-is
    if (patient.foto_url.startsWith("http")) return patient.foto_url
    // Otherwise, prepend the API base URL (remove /api suffix)
    const baseUrl = API_BASE_URL.replace(/\/api$/, "")
    return `${baseUrl}/${patient.foto_url.replace(/^src\//, "")}`
  }

  const tabs = [
    { id: "info" as TabType, label: "Información", icon: User },
    { id: "historia" as TabType, label: "Historia Clínica", icon: FileText },
    { id: "odontograma" as TabType, label: "Odontograma", icon: Smile },
    { id: "prescripciones" as TabType, label: "Prescripciones", icon: Pill },
    { id: "tratamientos" as TabType, label: "Tratamientos", icon: ClipboardList },
    { id: "archivos" as TabType, label: "Archivos", icon: File },
    { id: "cuenta_corriente" as TabType, label: "Cuenta Corriente", icon: File },
    { id: "recordatorios" as TabType, label: "Recordatorios", icon: Bell },
    { id: "turnos" as TabType, label: "Turnos", icon: Calendar },
    { id: "presupuestos" as TabType, label: "Presupuestos", icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h2>
          <p className="text-gray-600">Gestiona la información de tus pacientes</p>
        </div>
        <Button onClick={handleCreatePatient}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, teléfono..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-72">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium"
            >
              <option value="">Filtrar por mes de cumpleaños</option>
              <option value="1">Enero 🎂</option>
              <option value="2">Febrero 🎂</option>
              <option value="3">Marzo 🎂</option>
              <option value="4">Abril 🎂</option>
              <option value="5">Mayo 🎂</option>
              <option value="6">Junio 🎂</option>
              <option value="7">Julio 🎂</option>
              <option value="8">Agosto 🎂</option>
              <option value="9">Septiembre 🎂</option>
              <option value="10">Octubre 🎂</option>
              <option value="11">Noviembre 🎂</option>
              <option value="12">Diciembre 🎂</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Patients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : !patients || patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron pacientes
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4" onClick={() => handleViewPatient(patient)}>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.apellido}, {patient.nombre}
                          </div>
                          <div className="text-sm text-gray-500">{patient.sexo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{patient.tipo_documento}</div>
                      <div className="text-sm text-gray-500">{patient.numero_documento}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{patient.telefono || "-"}</div>
                      <div className="text-sm text-gray-500">{patient.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{calculateAge(patient.fecha_nacimiento)} años</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.condicion === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {patient.condicion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPatient(patient)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePatient(patient.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {
          patients && totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        }
      </Card>

      {/* Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === "view"
                    ? `${selectedPatient?.apellido}, ${selectedPatient?.nombre}`
                    : modalMode === "create"
                      ? "Nuevo Paciente"
                      : "Editar Paciente"}
                </h3>
                <div className="flex items-center gap-4">
                  {modalMode === "view" && selectedPatient && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPatient(selectedPatient)}
                      className="hidden sm:flex"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Paciente
                    </Button>
                  )}
                  <button onClick={() => {
                    setShowModal(false)
                    if (onClearPatient) onClearPatient()
                  }} className="text-gray-500 hover:text-gray-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {modalMode === "view" && selectedPatient && (
                <div className="border-b bg-gray-50">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-blue-500 text-blue-600 bg-white"
                            : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {modalMode === "view" && selectedPatient ? (
                  <div className="p-6">
                    {activeTab === "info" && (
                      <div className="space-y-6">
                        {/* Foto y Nombre */}
                        <div className="flex items-start gap-6">
                          <div className="relative group">
                            {getPhotoUrl(selectedPatient) ? (
                              <img
                                src={getPhotoUrl(selectedPatient)!}
                                alt={`${selectedPatient.nombre} ${selectedPatient.apellido}`}
                                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                                <User className="h-12 w-12 text-blue-600" />
                              </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                              <Camera className="h-6 w-6 text-white" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e, selectedPatient.id)}
                                disabled={uploadingPhoto}
                              />
                            </label>
                            {uploadingPhoto && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                <span className="text-white text-xs">Subiendo...</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {selectedPatient.apellido}, {selectedPatient.nombre}
                            </h3>
                            <p className="text-sm text-gray-500">{selectedPatient.tipo_documento} {selectedPatient.numero_documento}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(selectedPatient.fecha_nacimiento).toLocaleDateString("es-ES")} ({calculateAge(selectedPatient.fecha_nacimiento)} años) · {selectedPatient.sexo}
                            </p>
                          </div>
                        </div>

                        {/* Información Personal */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Información Personal
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Nombre Completo</p>
                              <p className="font-medium">
                                {selectedPatient.apellido}, {selectedPatient.nombre}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Documento</p>
                              <p className="font-medium">
                                {selectedPatient.tipo_documento} {selectedPatient.numero_documento}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                              <p className="font-medium">
                                {new Date(selectedPatient.fecha_nacimiento).toLocaleDateString("es-ES")} (
                                {calculateAge(selectedPatient.fecha_nacimiento)} años)
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Sexo</p>
                              <p className="font-medium">{selectedPatient.sexo}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contacto */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Contacto
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Teléfono</p>
                              <p className="font-medium">{selectedPatient.telefono || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="font-medium">{selectedPatient.email || "-"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500">Dirección</p>
                              <p className="font-medium">{selectedPatient.direccion || "-"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Información Adicional */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Información Adicional
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Ocupación</p>
                              <p className="font-medium">{selectedPatient.ocupacion || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Recomendado por</p>
                              <p className="font-medium">{selectedPatient.recomendado_por || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Obra Social</p>
                              <p className="font-medium">{selectedPatient.obraSocial?.nombre || "Sin obra social"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Nº de Afiliado</p>
                              <p className="font-medium">{selectedPatient.numero_afiliado || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Condición</p>
                              <p className="font-medium">{selectedPatient.condicion}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Condición IVA</p>
                              <p className="font-medium">{selectedPatient.condicion_iva || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tipo de Facturación</p>
                              <p className="font-medium">{selectedPatient.tipo_facturacion}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Número de Facturación</p>
                              <p className="font-medium">{selectedPatient.numero_facturacion || "-"}</p>
                            </div>
                          </div>
                          {selectedPatient.informacion_adicional && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-500 mb-1">Información Adicional</p>
                              <p className="text-sm bg-gray-50 p-3 rounded">{selectedPatient.informacion_adicional}</p>
                            </div>
                          )}

                          <div className="flex justify-end pt-6 border-t mt-6">
                            <Button variant="outline" onClick={() => handleEditPatient(selectedPatient)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Datos Personales
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "historia" && <ClinicalHistorySection pacienteId={selectedPatient.id} />}

                    {activeTab === "odontograma" && <OdontogramSection pacienteId={selectedPatient.id} />}

                    {activeTab === "prescripciones" && <PrescriptionsSection pacienteId={selectedPatient.id} />}

                    {activeTab === "tratamientos" && <TreatmentPlansSection pacienteId={selectedPatient.id} />}

                    {activeTab === "archivos" && <FilesSection pacienteId={selectedPatient.id} />}

                    {activeTab === "cuenta_corriente" && <CuentaCorrienteSection pacienteId={selectedPatient.id} />}

                    {activeTab === "recordatorios" && <RemindersSection pacienteId={selectedPatient.id} />}
                    {activeTab === "turnos" && <TurnosSection pacienteId={selectedPatient.id} />}
                    {activeTab === "presupuestos" && <PresupuestosSection pacienteId={selectedPatient.id} />}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Formulario de creación/edición */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input
                          type="text"
                          required
                          value={formData.apellido || ""}
                          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          required
                          value={formData.nombre || ""}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                        <select
                          required
                          value={formData.tipo_documento || ""}
                          onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="DNI">DNI</option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="Cédula">Cédula</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
                        <input
                          type="text"
                          required
                          value={formData.numero_documento || ""}
                          onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={formData.fecha_nacimiento || ""}
                          onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                        <select
                          value={formData.sexo || ""}
                          onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={formData.telefono || ""}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={formData.direccion || ""}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                        <input
                          type="text"
                          value={formData.ocupacion || ""}
                          onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recomendado por</label>
                        <input
                          type="text"
                          value={formData.recomendado_por || ""}
                          onChange={(e) => setFormData({ ...formData, recomendado_por: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obra Social</label>
                        <select
                          value={formData.obra_social_id || ""}
                          onChange={(e) => setFormData({ ...formData, obra_social_id: Number(e.target.value) || undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Ninguna</option>
                          {obrasSociales.map((os) => (
                            <option key={os.id} value={os.id}>
                              {os.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Afiliado</label>
                        <input
                          type="text"
                          value={formData.numero_afiliado || ""}
                          onChange={(e) => setFormData({ ...formData, numero_afiliado: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA</label>
                        <select
                          value={formData.condicion_iva || ""}
                          onChange={(e) => setFormData({ ...formData, condicion_iva: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="Consumidor Final">Consumidor Final</option>
                          <option value="Monotributista">Monotributista</option>
                          <option value="Responsable Inscripto">Responsable Inscripto</option>
                          <option value="Exento">Exento</option>
                          <option value="Gravado">Gravado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condición</label>
                        <select
                          value={formData.condicion || ""}
                          onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Facturación</label>
                        <select
                          value={formData.tipo_facturacion || ""}
                          onChange={(e) => setFormData({ ...formData, tipo_facturacion: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A">Factura A</option>
                          <option value="B">Factura B</option>
                          <option value="C">Factura C</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Facturación</label>
                        <input
                          type="text"
                          value={formData.numero_facturacion || ""}
                          onChange={(e) => setFormData({ ...formData, numero_facturacion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Información Adicional</label>
                        <textarea
                          value={formData.informacion_adicional || ""}
                          onChange={(e) => setFormData({ ...formData, informacion_adicional: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">{modalMode === "create" ? "Crear Paciente" : "Guardar Cambios"}</Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
