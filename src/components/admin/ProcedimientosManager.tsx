import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  X,
  Search,
  Check,
  DollarSign,
  Undo,
} from 'lucide-react'
import { procedimientosApi } from '../../api/procedimientos'
import { obrasSocialesApi } from '../../api/obras-sociales'
import type { Procedimiento, ObraSocial } from '../../types'

interface CustomPricingState {
  obra_social_id: number
  nombre_obra_social: string
  codigo: string
  precio_paciente: string
  usar_precio_particular: boolean
  cobertura: string
  precio_sugerido: string
}

const orderedContractNames = [
  "20 Ioma",
  "Osmecon",
  "Casa Circulo 51",
  "24 Galeno",
  "Assist Dent",
  "Amebpba Circulo 22",
  "Poder Judicial",
  "40 Sancor Salud",
  "83 Staff Medico",
  "Amffa 55 Farmaceuticos Florencio Ameghino",
  "America Servicios",
  "Jerarquicos Salud",
  "Ospib Roisa",
  "Imp Roisa",
  "Ospit Textiles Copago Roisa",
  "Avalian 16",
  "Osamoc Roisa",
  "Doctored 500 Roisa",
  "Doctored 2000",
  "Doctored 1000",
  "Doctored 3000",
  "Prevencion Salud Circulo 60",
  "Servicio Penitenciario Federal 57",
  "Accord Salud",
  "Pami",
  "Privamed 770",
  "Privamed 440 Copago",
  "Privamed 330 Copago",
  "Privamed 660 Copago",
  "Privamed 550 Copago",
  "Privamed 1000",
  "Colegio De Escribanos",
  "Federada Salud",
  "Osmiss Copago Roisa",
  "Ospep Roisa",
  "Doctored Ospese Roisa",
  "Clero",
  "Bienestar Salud Copago Roisa",
  "Ospfp Pintura Roisa",
  "Visitar Consulmed Copago",
  "Apres Consulmed",
  "Omint Circulo 03",
  "Dosuba Consulmed",
  "Ensalud Consulmed",
  "Jardineros Consulmed",
  "Osalara Consulmed",
  "Osptv Sat Consulmed",
  "Sadaic Consulmed",
  "Ostel Telefonicos Consulmed",
  "Ospiqyp Quimica Y Petrolera Consulmed",
  "Asmepriv Consulmed",
  "Andar Consulmed",
  "Visitar Consulmed",
  "Osim Consulmed",
  "Osdop Consulmed",
  "Igualdad Salud Roisa Suspendida",
  "Premedic",
  "Premedic 100",
  "Premedic 200",
  "Premedic 300",
  "Premedic 400 500",
  "Salud 360 Sin Copago Redsom",
  "Saber Salud Redsom Copago",
  "68 A Osblyca Cueros Y Anexos",
  "Privamed 880 Exento",
  "Privamed 880 Grav",
  "Medicus 97",
  "95 Medife",
  "Doctored Cuidarte Plus"
];

export const ProcedimientosManager: React.FC = () => {
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([])
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [nombre, setNombre] = useState('')
  const [precioArs, setPrecioArs] = useState('0')
  const [precioUsd, setPrecioUsd] = useState('0')
  const [preciosObraSocial, setPreciosObraSocial] = useState<CustomPricingState[]>([])
  const [saving, setSaving] = useState(false)

  // Cell Editing State (Inline Spreadsheet Style)
  const [editingCell, setEditingCell] = useState<{
    obraSocialId: number
    field: 'codigo' | 'precio_paciente' | 'cobertura' | 'precio_sugerido'
  } | null>(null)
  const [tempCellValue, setTempCellValue] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [procedimientosData, OSDatas] = await Promise.all([
        procedimientosApi.listar(),
        obrasSocialesApi.listar(),
      ])
      setProcedimientos(procedimientosData || [])
      
      // Sort loaded Obras Sociales according to orderedContractNames
      const sortedOS = (OSDatas || []).sort((a, b) => {
        const indexA = orderedContractNames.indexOf(a.nombre)
        const indexB = orderedContractNames.indexOf(b.nombre)
        
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.nombre.localeCompare(b.nombre)
      })

      setObrasSociales(sortedOS)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleCreate = () => {
    setEditingId(null)
    setNombre('')
    setPrecioArs('0')
    setPrecioUsd('0')
    setEditingCell(null)

    // Prepopulate grid with ALL Obras Sociales having default values
    const initialGrid = obrasSociales.map((os) => ({
      obra_social_id: os.id,
      nombre_obra_social: os.nombre,
      codigo: '',
      precio_paciente: '',
      usar_precio_particular: true,
      cobertura: '',
      precio_sugerido: '',
    }))
    setPreciosObraSocial(initialGrid)
    setShowModal(true)
  }

  const handleEdit = async (proc: Procedimiento) => {
    try {
      setSaving(true)
      // Fetch full details
      const fullProc = await procedimientosApi.obtener(proc.id)
      setEditingId(fullProc.id)
      setNombre(fullProc.nombre)
      setPrecioArs(String(fullProc.precio_ars))
      setPrecioUsd(String(fullProc.precio_usd))
      setEditingCell(null)

      // Map existing custom prices
      const grid = obrasSociales.map((os) => {
        const existing = fullProc.preciosObraSocial?.find(
          (p) => p.obra_social_id === os.id
        )
        return {
          obra_social_id: os.id,
          nombre_obra_social: os.nombre,
          codigo: existing?.codigo || '',
          precio_paciente: existing?.precio_paciente !== undefined && existing?.precio_paciente !== null ? String(existing.precio_paciente) : '',
          usar_precio_particular: existing?.usar_precio_particular !== undefined ? existing.usar_precio_particular : true,
          cobertura: existing?.cobertura !== undefined && existing?.cobertura !== null ? String(existing.cobertura) : '',
          precio_sugerido: existing?.precio_sugerido !== undefined && existing?.precio_sugerido !== null ? String(existing.precio_sugerido) : '',
        }
      })
      setPreciosObraSocial(grid)
      setShowModal(true)
    } catch (error) {
      console.error('Error loading procedure details:', error)
      alert('Error al cargar detalles del procedimiento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este procedimiento? Esta acción no se puede deshacer.')) {
      try {
        await procedimientosApi.eliminar(id)
        fetchData()
      } catch (error) {
        console.error('Error deleting procedure:', error)
        alert('Error al eliminar el procedimiento')
      }
    }
  }

  // Handle cell inline edit click
  const startEditingCell = (obraSocialId: number, field: 'codigo' | 'precio_paciente' | 'cobertura' | 'precio_sugerido', currentVal: string) => {
    setEditingCell({ obraSocialId, field })
    setTempCellValue(currentVal)
  }

  // Save inline cell input back to grid
  const saveCell = (obraSocialId: number, field: 'codigo' | 'precio_paciente' | 'cobertura' | 'precio_sugerido') => {
    setPreciosObraSocial((prev) =>
      prev.map((item) => {
        if (item.obra_social_id === obraSocialId) {
          const updated = { ...item, [field]: tempCellValue.trim() }
          if (field === 'precio_paciente' && tempCellValue.trim() !== '') {
            updated.usar_precio_particular = false
          }
          return updated
        }
        return item
      })
    )
    setEditingCell(null)
  }

  // Reset a custom patient price back to "Usando precio particular"
  const handleResetToParticular = (obraSocialId: number) => {
    setPreciosObraSocial((prev) =>
      prev.map((item) => {
        if (item.obra_social_id === obraSocialId) {
          return {
            ...item,
            precio_paciente: '',
            usar_precio_particular: true,
          }
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    // Format prices for transmission (filter out blank values to null)
    const formattedPrecios = preciosObraSocial
      .filter(item => item.codigo || !item.usar_precio_particular || item.cobertura || item.precio_sugerido)
      .map(item => ({
        obra_social_id: item.obra_social_id,
        codigo: item.codigo || null,
        precio_paciente: item.precio_paciente !== '' ? parseFloat(item.precio_paciente) : null,
        usar_precio_particular: item.usar_precio_particular,
        cobertura: item.cobertura !== '' ? parseFloat(item.cobertura) : null,
        precio_sugerido: item.precio_sugerido !== '' ? parseFloat(item.precio_sugerido) : null,
      }))

    const payload = {
      nombre: nombre.trim(),
      precio_ars: parseFloat(precioArs) || 0,
      precio_usd: parseFloat(precioUsd) || 0,
      preciosObraSocial: formattedPrecios,
    }

    try {
      setSaving(true)
      if (editingId) {
        await procedimientosApi.actualizar(editingId, payload)
      } else {
        await procedimientosApi.crear(payload)
      }
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error saving procedure:', error)
      alert('Error al guardar el procedimiento')
    } finally {
      setSaving(false)
    }
  }

  const filtered = procedimientos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#026498]" />
            Procedimientos
          </h2>
          <p className="text-gray-600">Configura los procedimientos clínicos y sus listas de precios de cobertura por Obra Social</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#026498]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Procedimiento
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar procedimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none"
          />
        </div>
      </Card>

      {/* Grid List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nombre del Procedimiento
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio Particular (ARS)
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio Particular (USD)
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Coberturas Especiales
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Cargando procedimientos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm
                      ? 'No se encontraron procedimientos con ese nombre'
                      : 'No hay procedimientos registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#026498]" />
                        </div>
                        <span className="font-bold text-gray-900">
                          {proc.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      ${Number(proc.precio_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                      US$ {Number(proc.precio_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#026498]">
                        {(proc.preciosObraSocial?.length || 0)} Obras Sociales
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(proc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(proc.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
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
        <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-600 font-bold">
          Total: {filtered.length} Procedimiento{filtered.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* Main Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-[#026498]" />
                  {editingId ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Define los precios base y configura coberturas por contrato.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Base Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre del Procedimiento *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Corona de Porcelana"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none bg-white text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    Moneda ARS / Importe en ARS
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precioArs}
                    onChange={(e) => setPrecioArs(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                    Moneda USD / Importe en USD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precioUsd}
                    onChange={(e) => setPrecioUsd(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none bg-white text-sm"
                  />
                </div>
              </div>

              {/* Custom Prices/Contract Grid */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Precios y Códigos por Contrato (Obra Social)</h4>
                  <p className="text-xs text-gray-500">Haz clic sobre cualquier celda "Editar..." para configurar un valor personalizado para ese contrato.</p>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto shadow-inner bg-gray-50">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider w-[250px]">
                          Contrato
                        </th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Precio a pagar por el paciente
                        </th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Cobertura de la obra social
                        </th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Precio sugerido por la obra social
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {preciosObraSocial.map((item) => {
                        const isEditingCell = (field: 'codigo' | 'precio_paciente' | 'cobertura' | 'precio_sugerido') =>
                          editingCell !== null && editingCell.obraSocialId === item.obra_social_id && editingCell.field === field

                        return (
                          <tr key={item.obra_social_id} className="hover:bg-blue-50/30 transition-colors">
                            {/* Contract Name */}
                            <td className="px-4 py-3 font-semibold text-gray-900 text-sm whitespace-nowrap">
                              {item.nombre_obra_social}
                            </td>

                            {/* Código Cell */}
                            <td className="px-4 py-2 text-sm">
                              {isEditingCell('codigo') ? (
                                <input
                                  type="text"
                                  value={tempCellValue}
                                  onChange={(e) => setTempCellValue(e.target.value)}
                                  onBlur={() => saveCell(item.obra_social_id, 'codigo')}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCell(item.obra_social_id, 'codigo')}
                                  className="w-full px-2 py-1 text-sm border border-[#026498] rounded focus:ring-1 focus:ring-[#026498] outline-none"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingCell(item.obra_social_id, 'codigo', item.codigo)}
                                  className={`font-semibold hover:underline text-left ${item.codigo ? 'text-gray-900' : 'text-blue-500/80 italic text-xs'}`}
                                >
                                  {item.codigo || 'Editar...'}
                                </button>
                              )}
                            </td>

                            {/* Precio a pagar por el paciente Cell */}
                            <td className="px-4 py-2 text-sm">
                              {isEditingCell('precio_paciente') ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tempCellValue}
                                  onChange={(e) => setTempCellValue(e.target.value)}
                                  onBlur={() => saveCell(item.obra_social_id, 'precio_paciente')}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCell(item.obra_social_id, 'precio_paciente')}
                                  className="w-full px-2 py-1 text-sm border border-[#026498] rounded focus:ring-1 focus:ring-[#026498] outline-none"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  {item.usar_precio_particular ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                      Usando precio particular
                                    </span>
                                  ) : (
                                    <span className="font-bold text-gray-900">
                                      ${parseFloat(item.precio_paciente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => startEditingCell(item.obra_social_id, 'precio_paciente', item.precio_paciente)}
                                    className="text-blue-500/80 hover:underline text-xs font-semibold"
                                  >
                                    Editar...
                                  </button>
                                  {!item.usar_precio_particular && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetToParticular(item.obra_social_id)}
                                      title="Volver a usar precio particular"
                                      className="text-gray-400 hover:text-[#026498] transition-colors p-0.5 rounded"
                                    >
                                      <Undo className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Cobertura Cell */}
                            <td className="px-4 py-2 text-sm">
                              {isEditingCell('cobertura') ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tempCellValue}
                                  onChange={(e) => setTempCellValue(e.target.value)}
                                  onBlur={() => saveCell(item.obra_social_id, 'cobertura')}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCell(item.obra_social_id, 'cobertura')}
                                  className="w-full px-2 py-1 text-sm border border-[#026498] rounded focus:ring-1 focus:ring-[#026498] outline-none"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingCell(item.obra_social_id, 'cobertura', item.cobertura)}
                                  className={`font-semibold hover:underline text-left ${item.cobertura ? 'text-gray-900 font-bold' : 'text-blue-500/80 italic text-xs'}`}
                                >
                                  {item.cobertura ? `$${parseFloat(item.cobertura).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Editar...'}
                                </button>
                              )}
                            </td>

                            {/* Precio sugerido Cell */}
                            <td className="px-4 py-2 text-sm">
                              {isEditingCell('precio_sugerido') ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tempCellValue}
                                  onChange={(e) => setTempCellValue(e.target.value)}
                                  onBlur={() => saveCell(item.obra_social_id, 'precio_sugerido')}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCell(item.obra_social_id, 'precio_sugerido')}
                                  className="w-full px-2 py-1 text-sm border border-[#026498] rounded focus:ring-1 focus:ring-[#026498] outline-none"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingCell(item.obra_social_id, 'precio_sugerido', item.precio_sugerido)}
                                  className={`font-semibold hover:underline text-left ${item.precio_sugerido ? 'text-gray-900 font-bold' : 'text-blue-500/80 italic text-xs'}`}
                                >
                                  {item.precio_sugerido ? `$${parseFloat(item.precio_sugerido).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Editar...'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions inside Modal */}
              <div className="flex justify-end space-x-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-[#026498]">
                  <Check className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
