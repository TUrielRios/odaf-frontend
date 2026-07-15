import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react'
import { cuentaCorrienteApi } from '../../api/cuenta-corriente'
import type { MovimientoCuenta } from '../../types'

interface CuentaCorrienteSectionProps {
    pacienteId: string
}

interface SummaryData {
    ingresos: number
    deudas: number
    saldo: number
}

const getLocalDateString = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const formatMovementDate = (dateString: string) => {
    if (!dateString) return ''
    try {
        const cleanDate = dateString.split('T')[0]
        const [year, month, day] = cleanDate.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('es-ES')
    } catch (e) {
        return dateString
    }
}

export const CuentaCorrienteSection: React.FC<CuentaCorrienteSectionProps> = ({ pacienteId }) => {
    const [movements, setMovements] = useState<MovimientoCuenta[]>([])
    const [summary, setSummary] = useState<SummaryData>({ ingresos: 0, deudas: 0, saldo: 0 })
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'Ingreso' | 'Deuda'>('Ingreso')

    // Form state
    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        monto: '',
        forma_pago: 'Efectivo',
        descripcion: ''
    })

    useEffect(() => {
        fetchData()
    }, [pacienteId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await cuentaCorrienteApi.getByPaciente(pacienteId)
            setMovements(response.movimientos)
            setSummary(response.resumen)
        } catch (error) {
            console.error('Error fetching cuenta corriente:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este movimiento?')) return
        try {
            await cuentaCorrienteApi.eliminar(id)
            fetchData()
        } catch (error) {
            console.error('Error deleting movement:', error)
            alert('Error al eliminar el movimiento')
        }
    }

    const handleOpenModal = (type: 'Ingreso' | 'Deuda') => {
        setModalType(type)
        setFormData({
            fecha: getLocalDateString(),
            monto: '',
            forma_pago: 'Efectivo',
            descripcion: ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await cuentaCorrienteApi.registrar(pacienteId, {
                fecha: formData.fecha,
                tipo: modalType,
                monto: parseFloat(formData.monto),
                forma_pago: modalType === 'Ingreso' ? formData.forma_pago : undefined,
                descripcion: formData.descripcion
            })
            setShowModal(false)
            fetchData()
        } catch (error) {
            console.error('Error registering movement:', error)
            alert('Error al registrar el movimiento')
        }
    }

    const formatCurrency = (amount: number | string) => {
        const val = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-green-50 border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Total Ingresos</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.ingresos)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-red-50 border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Total Deudas</p>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.deudas)}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Saldo Actual</p>
                            <p className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                {formatCurrency(summary.saldo)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Wallet className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleOpenModal('Deuda')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Deuda
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleOpenModal('Ingreso')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Ingreso
                </Button>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma de Pago</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay movimientos registrados</td></tr>
                            ) : (
                                movements.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                                            {formatMovementDate(mov.fecha)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${mov.tipo === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 min-w-[200px] max-w-md whitespace-normal break-words align-top">
                                            {mov.descripcion || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 align-top">
                                            {mov.forma_pago || '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium align-top ${mov.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {mov.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(mov.monto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                            <button onClick={() => handleDelete(mov.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {modalType === 'Ingreso' ? 'Registrar Ingreso' : 'Registrar Deuda'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.monto}
                                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                            className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {modalType === 'Ingreso' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
                                    <select
                                        value={formData.forma_pago}
                                        onChange={(e) => setFormData({ ...formData, forma_pago: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                                        <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Mercado Pago">Mercado Pago</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Información Adicional</label>
                                <textarea
                                    rows={4}
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Detalles del movimiento..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className={modalType === 'Ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                                    Registrar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
