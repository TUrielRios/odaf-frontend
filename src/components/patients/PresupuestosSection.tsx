"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Plus, Edit, Trash2, FileText, Calendar, X, DollarSign, Printer, Copy } from "lucide-react"
import { presupuestosApi } from "../../api"
import type { Presupuesto, PresupuestoItem, CrearPresupuestoData } from "../../types"
import { getErrorMessage } from "../../utils/errors"

interface PresupuestosSectionProps {
  pacienteId: string | number
}

export const PresupuestosSection: React.FC<PresupuestosSectionProps> = ({ pacienteId }) => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view")
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)
  
  // Form states
  const [descripcion, setDescripcion] = useState("")
  const [estado, setEstado] = useState("Pendiente")
  const [observaciones, setObservaciones] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<PresupuestoItem[]>([])

  // Item builder states
  const [itemDescripcion, setItemDescripcion] = useState("")
  const [itemCantidad, setItemCantidad] = useState(1)
  const [itemPrecio, setItemPrecio] = useState(0)

  useEffect(() => {
    fetchPresupuestos()
  }, [pacienteId])

  const fetchPresupuestos = async () => {
    try {
      setLoading(true)
      const data = await presupuestosApi.listar(pacienteId)
      setPresupuestos(data || [])
    } catch (error) {
      console.error("Error fetching budgets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setDescripcion("")
    setEstado("Pendiente")
    setObservaciones("")
    setFecha(new Date().toISOString().split("T")[0])
    setItems([])
    setItemDescripcion("")
    setItemCantidad(1)
    setItemPrecio(0)
    setModalMode("create")
    setShowModal(true)
  }

  const handleEdit = (p: Presupuesto) => {
    setSelectedPresupuesto(p)
    setDescripcion(p.descripcion || "")
    setEstado(p.estado)
    setObservaciones(p.observaciones || "")
    setFecha(p.fecha)
    setItems(p.items || [])
    setItemDescripcion("")
    setItemCantidad(1)
    setItemPrecio(0)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleView = (p: Presupuesto) => {
    setSelectedPresupuesto(p)
    setModalMode("view")
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este presupuesto? Esta acción no se puede deshacer.")) {
      try {
        await presupuestosApi.eliminar(id)
        fetchPresupuestos()
      } catch (error) {
        console.error("Error deleting budget:", error)
        alert("Error al eliminar el presupuesto")
      }
    }
  }

  const handleAddItem = () => {
    if (!itemDescripcion.trim()) {
      alert("Por favor, ingresa una descripción para el ítem.")
      return
    }
    if (itemCantidad <= 0) {
      alert("La cantidad debe ser mayor a 0.")
      return
    }
    if (itemPrecio < 0) {
      alert("El precio unitario no puede ser negativo.")
      return
    }

    const newItem: PresupuestoItem = {
      descripcion: itemDescripcion,
      cantidad: itemCantidad,
      precio_unitario: itemPrecio,
      total: itemCantidad * itemPrecio
    }

    setItems([...items, newItem])
    setItemDescripcion("")
    setItemCantidad(1)
    setItemPrecio(0)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      alert("Por favor, agrega al menos un ítem al presupuesto.")
      return
    }

    const total = calculateTotal()

    const payload: CrearPresupuestoData = {
      paciente_id: String(pacienteId),
      fecha,
      descripcion,
      items,
      monto_total: total,
      estado,
      observaciones
    }

    try {
      if (modalMode === "create") {
        await presupuestosApi.crear(payload)
      } else if (modalMode === "edit" && selectedPresupuesto) {
        await presupuestosApi.actualizar(selectedPresupuesto.id, payload)
      }
      setShowModal(false)
      fetchPresupuestos()
    } catch (error) {
      console.error("Error saving budget:", error)
      alert(getErrorMessage(error, "Error al guardar el presupuesto"))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyToClipboard = (p: Presupuesto) => {
    const itemsText = p.items.map(item => `- ${item.descripcion} (Cant: ${item.cantidad}) x $${Number(item.precio_unitario).toLocaleString('es-AR')}: $${Number(item.total).toLocaleString('es-AR')}`).join('\n')
    
    const textToCopy = `📋 *PRESUPUESTO ODONTOLÓGICO - ODAF*
Fecha: ${new Date(p.fecha).toLocaleDateString('es-ES')}
Estado: ${p.estado}
Descripción: ${p.descripcion || 'Sin descripción'}

*Detalle de prestaciones:*
${itemsText}

*Monto Total:* $${Number(p.monto_total).toLocaleString('es-AR')}

${p.observaciones ? `*Observaciones:* ${p.observaciones}\n` : ''}
---
Quedamos a su entera disposición para cualquier consulta.
ODAF Odontología.`

    navigator.clipboard.writeText(textToCopy)
    alert("¡Presupuesto copiado al portapapeles en formato WhatsApp!")
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Aprobado":
        return "bg-green-100 text-green-800 border-green-200"
      case "Rechazado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500 font-medium">Cargando presupuestos...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[#026498]" />
          Presupuestos / Estimaciones
        </h3>
        <Button onClick={handleCreate} size="sm" className="bg-[#026498] hover:bg-[#014e78]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Main Budget Grid/List */}
      {presupuestos.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 border border-dashed border-gray-300">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-700">No se han registrado presupuestos para este paciente.</p>
          <p className="text-sm text-gray-500 mt-1">Crea estimaciones con conceptos, cantidades y costos estructurados.</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4 border-[#026498] text-[#026498] hover:bg-blue-50">
            Crear primer presupuesto
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestos.map((p) => (
            <Card key={p.id} className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between border border-gray-100 bg-white">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(p.fecha).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusBadgeClass(p.estado)}`}>
                    {p.estado}
                  </span>
                </div>

                <h4 className="font-bold text-gray-800 text-base mb-2">
                  {p.descripcion || "Presupuesto de Tratamiento"}
                </h4>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p className="flex justify-between border-b pb-1">
                    <span>Ítems:</span>
                    <span className="font-semibold text-gray-900">{p.items?.length || 0} prestaciones</span>
                  </p>
                  <p className="flex justify-between text-base font-bold text-gray-900 pt-1">
                    <span>Total Estimado:</span>
                    <span className="text-[#026498] font-black">$ {Number(p.monto_total).toLocaleString("es-AR")}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(p)} title="Copiar para WhatsApp">
                  <Copy className="h-4 w-4 text-gray-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleView(p)} title="Ver detalles">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(p)} title="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleDelete(p.id)} title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col print:shadow-none print:max-h-full print:overflow-visible">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10 print:hidden">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === "view"
                  ? "Presupuesto Odontológico"
                  : modalMode === "create"
                    ? "Nuevo Presupuesto"
                    : "Editar Presupuesto"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* View Mode (Print friendly invoice layout) */}
            {modalMode === "view" && selectedPresupuesto && (
              <div className="p-8 space-y-6 print:p-0">
                {/* Header Factura/Presupuesto */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-[#026498] tracking-tight">ODAF</h2>
                    <p className="text-sm text-gray-500 font-semibold mt-1">Centro de Gestión Odontológica</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-extrabold text-gray-800">PRESUPUESTO Nº {selectedPresupuesto.id}</h3>
                    <p className="text-sm text-gray-500 mt-1">Fecha: {new Date(selectedPresupuesto.fecha).toLocaleDateString("es-ES")}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadgeClass(selectedPresupuesto.estado)}`}>
                      {selectedPresupuesto.estado}
                    </span>
                  </div>
                </div>

                {/* Info del Presupuesto */}
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl print:bg-transparent print:border">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Detalle / Concepto:</span>
                    <p className="font-bold text-gray-800 mt-1">{selectedPresupuesto.descripcion || "Tratamiento Dental General"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Paciente ID:</span>
                    <p className="font-semibold text-gray-700 mt-1">{selectedPresupuesto.paciente?.apellido}, {selectedPresupuesto.paciente?.nombre}</p>
                    <p className="text-xs text-gray-500">DNI: {selectedPresupuesto.paciente?.numero_documento}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Conceptos y Costos Detallados</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Prestación / Concepto</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Cant.</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Prec. Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPresupuesto.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{item.descripcion}</td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{item.cantidad}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">$ {Number(item.precio_unitario).toLocaleString("es-AR")}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-[#026498]">$ {Number(item.total).toLocaleString("es-AR")}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t font-black text-gray-900">
                          <td colSpan={3} className="px-4 py-4 text-right text-sm">MONTO ESTIMADO TOTAL:</td>
                          <td className="px-4 py-4 text-right text-lg text-[#026498]">$ {Number(selectedPresupuesto.monto_total).toLocaleString("es-AR")}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Observaciones */}
                {selectedPresupuesto.observaciones && (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Observaciones / Términos de Validez:</span>
                    <p className="text-sm text-blue-900 mt-1 whitespace-pre-line">{selectedPresupuesto.observaciones}</p>
                  </div>
                )}

                {/* Footer del Presupuesto */}
                <div className="text-center pt-8 text-xs text-gray-400 border-t">
                  <p>Este documento es un presupuesto estimado sujeto a variaciones según evaluación médica final.</p>
                  <p className="mt-1">ODAF Odontología Integral · Tel: +54 9 11 5555-5555 · Email: info@odafodontologia.com</p>
                </div>

                {/* Acciones de Impresión */}
                <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
                  <Button variant="outline" onClick={() => handleCopyToClipboard(selectedPresupuesto)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar WhatsApp
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Presupuesto
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}

            {/* Create & Edit Mode (Form Layout) */}
            {(modalMode === "create" || modalMode === "edit") && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Form General Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Título / Concepto General *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Presupuesto para tratamiento de conducto e implantes"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Emisión *</label>
                    <input
                      type="date"
                      required
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Items Builder Section */}
                <div className="border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-1.5 text-[#026498]">
                    <Plus className="h-4 w-4" />
                    Constructor de Ítems / Prestaciones
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-600 mb-1">Descripción de la Prestación</label>
                      <input
                        type="text"
                        placeholder="Ej: Corona de porcelana sobre implante"
                        value={itemDescripcion}
                        onChange={(e) => setItemDescripcion(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={itemCantidad}
                        onChange={(e) => setItemCantidad(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Precio Unitario ($)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={itemPrecio === 0 ? "" : itemPrecio}
                        onChange={(e) => setItemPrecio(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleAddItem} size="sm" className="bg-[#026498] hover:bg-[#014e78]">
                      Agregar ítem
                    </Button>
                  </div>
                </div>

                {/* Items Table List */}
                {items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase">Detalle</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase w-20">Cant.</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase w-32">P. Unit.</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase w-32">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">{item.descripcion}</td>
                            <td className="px-4 py-2.5 text-center text-sm font-bold text-gray-700">{item.cantidad}</td>
                            <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-600">$ {Number(item.precio_unitario).toLocaleString("es-AR")}</td>
                            <td className="px-4 py-2.5 text-right text-sm font-bold text-[#026498]">$ {Number(item.total).toLocaleString("es-AR")}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-black text-gray-900 border-t">
                          <td colSpan={3} className="px-4 py-3 text-right text-sm">TOTAL ESTIMADO:</td>
                          <td className="px-4 py-3 text-right text-base text-[#026498]">$ {calculateTotal().toLocaleString("es-AR")}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Additional Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Estado del Presupuesto</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] bg-white text-gray-800 font-semibold"
                    >
                      <option value="Pendiente">Pendiente ⏳</option>
                      <option value="Aprobado">Aprobado ✅</option>
                      <option value="Rechazado">Rechazado ❌</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones / Términos de Validez</label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Validez por 15 días debido a costos de insumos. Financiación disponible."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026498] bg-white text-gray-800"
                    />
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#026498] hover:bg-[#014e78]">
                    {modalMode === "create" ? "Crear Presupuesto" : "Guardar Cambios"}
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
