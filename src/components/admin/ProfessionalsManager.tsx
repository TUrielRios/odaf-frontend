"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Award, Award as IdCard, Clock, Briefcase, Upload, X } from 'lucide-react'
import { adminApi } from "../../api/admin"
import { ScheduleManager } from "../schedule/ScheduleManager"
import { ServiceAssignment } from "./ServiceAssignment"
import type { Profesional, CrearProfesionalData, HorariosSemanales, Servicio } from "../../types"

type ViewMode = 'list' | 'schedule' | 'services'

export const ProfessionalsManager: React.FC = () => {
  const [professionals, setProfessionals] = useState<Profesional[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null)
  const [editingProfessional, setEditingProfessional] = useState<Profesional | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState<CrearProfesionalData>({
    apellido: "",
    nombre: "",
    numero_documento: "",
    email: "",
    telefono: "",
    especialidad: "",
    numero_matricula: "",
    color: "#026498",
    foto_url: "",
    porcentaje_comision: 50,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CrearProfesionalData, string>>>({})

  useEffect(() => {
    fetchProfessionals()
  }, [searchTerm, statusFilter])

  const fetchProfessionals = async () => {
    try {
      const response = await adminApi.profesionales.listar({
        search: searchTerm,
        estado: statusFilter,
      })
      setProfessionals(response.data)
    } catch (error) {
      console.error("Error fetching professionals:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CrearProfesionalData, string>> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.apellido.trim()) newErrors.apellido = "El apellido es requerido"
    if (!formData.numero_documento.trim()) newErrors.numero_documento = "El número de documento es requerido"
    if (!formData.email?.trim()) newErrors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(formData.email || "")) newErrors.email = "El email no es válido"
    if (!formData.telefono?.trim()) newErrors.telefono = "El teléfono es requerido"
    if (!formData.especialidad.trim()) newErrors.especialidad = "La especialidad es requerida"
    if (!formData.numero_matricula.trim()) newErrors.numero_matricula = "El número de matrícula es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingProfessional) {
        await adminApi.profesionales.actualizar(editingProfessional.id, formData)
      } else {
        await adminApi.profesionales.crear(formData)
      }

      resetForm()
      fetchProfessionals()
    } catch (error) {
      console.error("Error saving professional:", error)
    }
  }

  const handleEdit = (professional: Profesional) => {
    setEditingProfessional(professional)
    setFormData({
      apellido: professional.apellido,
      nombre: professional.nombre,
      numero_documento: professional.numero_documento,
      email: professional.email || "",
      telefono: professional.telefono || "",
      especialidad: professional.especialidad,
      numero_matricula: professional.numero_matricula,
      color: professional.color || "#026498",
      foto_url: professional.foto_url || "",
      porcentaje_comision: professional.porcentaje_comision ?? 50,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este profesional?")) {
      try {
        await adminApi.profesionales.eliminar(id)
        fetchProfessionals()
      } catch (error) {
        console.error("Error deleting professional:", error)
      }
    }
  }

  const handleManageSchedule = (professional: Profesional) => {
    setSelectedProfessional(professional)
    setViewMode('schedule')
  }

  const handleManageServices = (professional: Profesional) => {
    setSelectedProfessional(professional)
    setViewMode('services')
  }

  const handleScheduleUpdate = (horarios: HorariosSemanales) => {
    if (selectedProfessional) {
      setProfessionals((prev) =>
        prev.map((prof) => (prof.id === selectedProfessional.id ? { ...prof, horarios_atencion: horarios } : prof)),
      )
    }
  }

  const handleServicesUpdate = (servicios: Servicio[]) => {
    if (selectedProfessional) {
      setProfessionals((prev) =>
        prev.map((prof) => (prof.id === selectedProfessional.id ? { ...prof, servicios } : prof)),
      )
    }
  }

  const resetForm = () => {
    setFormData({
      apellido: "",
      nombre: "",
      numero_documento: "",
      email: "",
      telefono: "",
      especialidad: "",
      numero_matricula: "",
      color: "#026498",
      foto_url: "",
      porcentaje_comision: 50,
    })
    setErrors({})
    setEditingProfessional(null)
    setShowForm(false)
  }

  const handleChange = (field: keyof CrearProfesionalData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingProfessional) return

    try {
      setUploading(true)
      const response = await adminApi.profesionales.subirFoto(editingProfessional.id, file)
      setFormData((prev) => ({ ...prev, foto_url: response.foto_url }))
      alert("Foto subida correctamente")
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Error al subir la foto")
    } finally {
      setUploading(false)
    }
  }

  if (viewMode === 'schedule' && selectedProfessional) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Horarios</h2>
            <p className="text-muted-foreground">Configura los horarios de atención del profesional</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setViewMode('list')
              setSelectedProfessional(null)
            }}
          >
            Volver
          </Button>
        </div>

        <ScheduleManager professional={selectedProfessional} onScheduleUpdate={handleScheduleUpdate} />
      </div>
    )
  }

  if (viewMode === 'services' && selectedProfessional) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Servicios</h2>
            <p className="text-muted-foreground">Asigna servicios al profesional</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setViewMode('list')
              setSelectedProfessional(null)
            }}
          >
            Volver
          </Button>
        </div>

        <ServiceAssignment professional={selectedProfessional} onServicesUpdate={handleServicesUpdate} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Profesionales</h2>
          <p className="text-muted-foreground">Administra los profesionales del centro odontológico</p>
        </div>

        <Button onClick={() => setShowForm(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de profesionales */}
      <Card className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay profesionales registrados</p>
            <p>Comienza agregando tu primer profesional</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Profesional</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Documento</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Contacto</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Especialidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Matrícula</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Comisión</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((professional) => (
                  <tr
                    key={professional.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 overflow-hidden border border-border">
                          {professional.foto_url ? (
                            <img src={professional.foto_url} alt={`${professional.nombre} ${professional.apellido}`} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {professional.nombre} {professional.apellido}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <IdCard className="h-3 w-3 mr-1" />
                        {professional.numero_documento}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {professional.email}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {professional.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-foreground">
                        <Award className="h-4 w-4 mr-2" />
                        {professional.especialidad}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-mono text-foreground">{professional.numero_matricula}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-foreground">{professional.porcentaje_comision ?? 50}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${professional.estado === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                      >
                        {professional.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageServices(professional)}
                          title="Gestionar servicios"
                        >
                          <Briefcase className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageSchedule(professional)}
                          title="Gestionar horarios"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(professional)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(professional.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border bg-white sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-foreground">
                {editingProfessional ? "Editar Profesional" : "Nuevo Profesional"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    placeholder="Nombre del profesional"
                    className={errors.nombre ? "border-red-500" : ""}
                  />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Apellido *</label>
                  <Input
                    value={formData.apellido}
                    onChange={(e) => handleChange("apellido", e.target.value)}
                    placeholder="Apellido del profesional"
                    className={errors.apellido ? "border-red-500" : ""}
                  />
                  {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Número de Documento *</label>
                <Input
                  value={formData.numero_documento}
                  onChange={(e) => handleChange("numero_documento", e.target.value)}
                  placeholder="12345678"
                  className={errors.numero_documento ? "border-red-500" : ""}
                />
                {errors.numero_documento && <p className="text-red-500 text-xs mt-1">{errors.numero_documento}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@ejemplo.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Teléfono *</label>
                  <Input
                    type="tel"
                    value={formData.telefono || ""}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className={errors.telefono ? "border-red-500" : ""}
                  />
                  {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Especialidad *</label>
                  <Input
                    value={formData.especialidad}
                    onChange={(e) => handleChange("especialidad", e.target.value)}
                    placeholder="Ej: Odontología General"
                    className={errors.especialidad ? "border-red-500" : ""}
                  />
                  {errors.especialidad && <p className="text-red-500 text-xs mt-1">{errors.especialidad}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Número de Matrícula *</label>
                  <Input
                    value={formData.numero_matricula}
                    onChange={(e) => handleChange("numero_matricula", e.target.value)}
                    placeholder="MP 12345"
                    className={errors.numero_matricula ? "border-red-500" : ""}
                  />
                  {errors.numero_matricula && <p className="text-red-500 text-xs mt-1">{errors.numero_matricula}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Color Identificativo</label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="color"
                      value={formData.color || "#026498"}
                      onChange={(e) => handleChange("color", e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">
                      Color en el calendario.
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Porcentaje de Comisión (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.porcentaje_comision ?? 50}
                    onChange={(e) => setFormData(prev => ({ ...prev, porcentaje_comision: Number(e.target.value) }))}
                    placeholder="50"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Porcentaje que recibe el profesional en las liquidaciones.
                  </span>
                </div>
              </div>

              {editingProfessional && (
                <div className="border-t border-border pt-4 mt-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Foto de Perfil</label>
                  <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24 rounded-2xl bg-muted overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
                      {formData.foto_url ? (
                        <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground opacity-50" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-3">
                        Formatos aceptados: JPG, PNG, WEBP. Máximo 5MB.<br />
                        La imagen se redimensionará automáticamente.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.foto_url ? 'Cambiar Foto' : 'Subir Foto'}
                        </Button>
                        {formData.foto_url && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-100 hover:bg-red-50"
                            onClick={() => handleChange("foto_url", "")}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">{editingProfessional ? "Actualizar" : "Crear"} Profesional</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
