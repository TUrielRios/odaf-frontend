import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { dentalColors } from '../../config/colors'
import { Plus, Search, Edit, Trash2, Briefcase, Clock, DollarSign, Tag } from 'lucide-react'
import { adminApi } from '../../api/admin'
import type { Servicio, CrearServicioData } from '../../types'

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Servicio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<CrearServicioData>({
    nombre: '',
    descripcion: '',
    precio_base: 0,
    duracion_estimada: 30,
    categoria: '' // AGREGADO
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CrearServicioData, string>>>({})

  // Categorías disponibles - puedes ajustarlas según tus necesidades
  const categorias = [
    'Odontología General',
    'Ortodoncia',
    'Endodoncia',
    'Periodoncia',
    'Cirugía',
    'Estética Dental',
    'Implantes',
    'Prótesis',
    'Odontopediatría',
    'Otro'
  ]

  useEffect(() => {
    fetchServices()
  }, [searchTerm])

  const fetchServices = async () => {
    try {
      const response = await adminApi.servicios.listar({
        search: searchTerm
      })
      setServices(response.data)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CrearServicioData, string>> = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.categoria) newErrors.categoria = 'La categoría es requerida' // AGREGADO
    if (formData.precio_base <= 0) newErrors.precio_base = 'El precio_base debe ser mayor a 0'
    if (formData.duracion_estimada < 15 || formData.duracion_estimada > 480) {
      newErrors.duracion_estimada = 'La duración debe estar entre 15 y 480 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // Transformar los datos al formato que espera el backend
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_base: formData.precio_base, // Corregido: era precio_base_base
        duracion_estimada: formData.duracion_estimada,
        categoria: formData.categoria
      }

      if (editingService) {
        await adminApi.servicios.actualizar(editingService.id, dataToSend)
      } else {
        await adminApi.servicios.crear(dataToSend)
      }
      
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleEdit = (service: Servicio) => {
    setEditingService(service)
    setFormData({
      nombre: service.nombre,
      descripcion: service.descripcion || '',
      precio_base: service.precio_base,
      duracion_estimada: service.duracion_estimada,
      categoria: service.categoria || '' // AGREGADO
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        await adminApi.servicios.eliminar(id)
        fetchServices()
      } catch (error) {
        console.error('Error deleting service:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_base: 0,
      duracion_estimada: 30,
      categoria: '' // AGREGADO
    })
    setErrors({})
    setEditingService(null)
    setShowForm(false)
  }

  const handleChange = (field: keyof CrearServicioData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold text-[${dentalColors.gray900}]`}>
            Gestión de Servicios
          </h2>
          <p className={`text-[${dentalColors.gray600}]`}>
            Administra los servicios ofrecidos por el centro
          </p>
        </div>
        
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[${dentalColors.gray400}]`} />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-[${dentalColors.gray300}] rounded-lg focus:outline-none focus:ring-2 focus:ring-[${dentalColors.primary}] focus:border-transparent`}
          />
        </div>
      </Card>

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className={`h-48 bg-[${dentalColors.gray100}] rounded-xl animate-pulse`}></div>
          ))
        ) : services.length === 0 ? (
          <div className={`col-span-full text-center py-12 text-[${dentalColors.gray500}]`}>
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay servicios registrados</p>
            <p>Comienza agregando tu primer servicio</p>
          </div>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg bg-[${dentalColors.primary}]/10 flex items-center justify-center`}>
                  <Briefcase className={`h-6 w-6 text-[${dentalColors.primary}]`} />
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className={`font-semibold text-[${dentalColors.gray900}] mb-2`}>
                {service.nombre}
              </h3>
              
              {service.categoria && (
                <div className="flex items-center mb-2">
                  <Tag className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-xs text-gray-500">{service.categoria}</span>
                </div>
              )}
              
              {service.descripcion && (
                <p className={`text-sm text-[${dentalColors.gray600}] mb-4 line-clamp-2`}>
                  {service.descripcion}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className={`flex items-center text-sm text-[${dentalColors.gray500}]`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {service.duracion_estimada || service.duracion_estimada} min
                </div>
                <div className={`flex items-center text-[${dentalColors.primary}] font-semibold`}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  {parseFloat(String(service.precio_base || 0)).toFixed(2)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  service.estado === 'Activo'
                    ? `bg-[${dentalColors.success}]/10 text-[${dentalColors.success}]`
                    : `bg-[${dentalColors.error}]/10 text-[${dentalColors.error}]`
                }`}>
                  {service.estado || 'Inactivo'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`px-6 py-4 border-b border-[${dentalColors.gray200}]`}>
              <h3 className={`text-lg font-semibold text-[${dentalColors.gray900}]`}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nombre del Servicio *"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={errors.nombre}
                placeholder="Ej: Limpieza dental"
              />

              {/* CAMPO CATEGORÍA AGREGADO */}
              <div>
                <label className={`block text-sm font-medium text-[${dentalColors.gray700}] mb-1`}>
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.categoria ? 'border-red-500' : `border-[${dentalColors.gray300}]`
                  } rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[${dentalColors.primary}] focus:border-transparent hover:border-[${dentalColors.gray400}]`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium text-[${dentalColors.gray700}] mb-1`}>
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  className={`w-full px-3 py-2 border border-[${dentalColors.gray300}] rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[${dentalColors.primary}] focus:border-transparent hover:border-[${dentalColors.gray400}]`}
                  placeholder="Descripción del servicio..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Precio Base *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_base}
                  onChange={(e) => handleChange('precio_base', parseFloat(e.target.value) || 0)}
                  error={errors.precio_base}
                  placeholder="0.00"
                />
                <Input
                  label="Duración (minutos) *"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.duracion_estimada}
                  onChange={(e) => handleChange('duracion_estimada', parseInt(e.target.value) || 30)}
                  error={errors.duracion_estimada}
                  placeholder="30"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Actualizar' : 'Crear'} Servicio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
