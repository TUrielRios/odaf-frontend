import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
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
  ChevronRight
} from 'lucide-react'
import { pacientesApi } from '../../api'
import { getErrorMessage } from '../../utils/errors'
import type { Paciente, CrearPacienteData } from '../../types'

export const PatientsView: React.FC = () => {
  const [patients, setPatients] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view')
  const [formData, setFormData] = useState<Partial<CrearPacienteData>>({})

  useEffect(() => {
    fetchPatients()
  }, [currentPage, searchTerm])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await pacientesApi.listar({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined
      })
      setPatients(response.data)
      setTotalPages(response.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleCreatePatient = () => {
    setFormData({
      condicion: 'Activo',
      tipo_facturacion: 'Particular'
    })
    setModalMode('create')
    setShowModal(true)
  }

  const handleViewPatient = (patient: Paciente) => {
    setSelectedPatient(patient)
    setModalMode('view')
    setShowModal(true)
  }

  const handleEditPatient = (patient: Paciente) => {
    setSelectedPatient(patient)
    setFormData({
      apellido: patient.apellido,
      nombre: patient.nombre,
      tipo_documento: patient.tipo_documento,
      numero_documento: patient.numero_documento,
      fecha_nacimiento: patient.fecha_nacimiento,
      sexo: patient.sexo,
      telefono: patient.telefono,
      email: patient.email,
      direccion: patient.direccion,
      ocupacion: patient.ocupacion,
      recomendado_por: patient.recomendado_por,
      condicion: patient.condicion,
      tipo_facturacion: patient.tipo_facturacion,
      numero_facturacion: patient.numero_facturacion,
      informacion_adicional: patient.informacion_adicional
    })
    setModalMode('edit')
    setShowModal(true)
  }

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      return
    }

    try {
      await pacientesApi.eliminar(id)
      await fetchPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Error al eliminar el paciente')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (modalMode === 'create') {
        await pacientesApi.crear(formData as CrearPacienteData)
      } else if (modalMode === 'edit' && selectedPatient) {
        await pacientesApi.actualizar(selectedPatient.id, formData)
      }

      setShowModal(false)
      setFormData({})
      await fetchPatients()
    } catch (error) {
      console.error('Error saving patient:', error)
      alert(getErrorMessage(error, 'Error al guardar el paciente'))
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
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
              ) : patients.length === 0 ? (
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
                      <div className="text-sm text-gray-900">{patient.telefono || '-'}</div>
                      <div className="text-sm text-gray-500">{patient.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {calculateAge(patient.fecha_nacimiento)} años
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.condicion === 'Activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'view' ? 'Detalles del Paciente' :
                  modalMode === 'create' ? 'Nuevo Paciente' : 'Editar Paciente'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === 'view' && selectedPatient ? (
              <div className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Información Personal
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Nombre Completo</p>
                      <p className="font-medium">{selectedPatient.apellido}, {selectedPatient.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Documento</p>
                      <p className="font-medium">{selectedPatient.tipo_documento} {selectedPatient.numero_documento}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                      <p className="font-medium">
                        {new Date(selectedPatient.fecha_nacimiento).toLocaleDateString('es-ES')}
                        ({calculateAge(selectedPatient.fecha_nacimiento)} años)
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
                      <p className="font-medium">{selectedPatient.telefono || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedPatient.email || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Dirección</p>
                      <p className="font-medium">{selectedPatient.direccion || '-'}</p>
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
                      <p className="font-medium">{selectedPatient.ocupacion || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recomendado por</p>
                      <p className="font-medium">{selectedPatient.recomendado_por || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Obra Social</p>
                      <p className="font-medium">{selectedPatient.obraSocial?.nombre || 'Sin obra social'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Condición</p>
                      <p className="font-medium">{selectedPatient.condicion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tipo de Facturación</p>
                      <p className="font-medium">{selectedPatient.tipo_facturacion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Número de Facturación</p>
                      <p className="font-medium">{selectedPatient.numero_facturacion || '-'}</p>
                    </div>
                  </div>
                  {selectedPatient.informacion_adicional && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">Información Adicional</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedPatient.informacion_adicional}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Formulario de creación/edición */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido || ''}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      required
                      value={formData.tipo_documento || ''}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero_documento || ''}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sexo
                    </label>
                    <select
                      value={formData.sexo || ''}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono || ''}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion || ''}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ocupación
                    </label>
                    <input
                      type="text"
                      value={formData.ocupacion || ''}
                      onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recomendado por
                    </label>
                    <input
                      type="text"
                      value={formData.recomendado_por || ''}
                      onChange={(e) => setFormData({ ...formData, recomendado_por: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {modalMode === 'create' ? 'Crear Paciente' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}