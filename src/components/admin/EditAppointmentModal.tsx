import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { turnosApi, adminApi, recordatoriosApi, pacientesApi } from '../../api'
import type { Turno, Profesional, Paciente } from '../../types'
import { Mail, Search, User as UserIcon, X } from 'lucide-react'

interface EditAppointmentModalProps {
    appointment: Turno
    onClose: () => void
    onUpdate: () => void
}

export const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({ appointment, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        fecha: appointment.fecha,
        hora_inicio: appointment.hora_inicio,
        hora_fin: appointment.hora_fin,
        profesional_id: appointment.profesional_id,
        paciente_id: appointment.paciente_id,
        estado: appointment.estado,
        observaciones: appointment.observaciones || ''
    })
    const [loading, setLoading] = useState(false)
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [sendingReminder, setSendingReminder] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [showPatientSearch, setShowPatientSearch] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(appointment.paciente || null)

    useEffect(() => {
        const fetchProfesionales = async () => {
            try {
                const response = await adminApi.profesionales.listar({ limit: 100 })
                setProfesionales(response.data || [])
            } catch (error) {
                console.error('Error fetching professionals:', error)
            }
        }
        fetchProfesionales()
    }, [])

    useEffect(() => {
        if (searchTerm.trim().length >= 3) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const response = await pacientesApi.listar({ search: searchTerm, limit: 5 })
                    setPacientes(response.data)
                } catch (error) {
                    console.error('Error searching patients:', error)
                }
            }, 300)
            return () => clearTimeout(delayDebounceFn)
        } else {
            setPacientes([])
        }
    }, [searchTerm])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await turnosApi.actualizar(appointment.id, formData)
            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error updating appointment:', error)
            alert('Error al actualizar el turno')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-[95%] sm:max-w-xl h-fit max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Editar Turno</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Modificación de agenda</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium mb-1">Paciente</label>
                        {!showPatientSearch ? (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-50 border rounded-md p-2 text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <UserIcon size={14} className="text-[#026498]" />
                                    {selectedPatient ? `${selectedPatient.apellido}, ${selectedPatient.nombre}` : 'Sin paciente'}
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-9 text-xs"
                                    onClick={() => setShowPatientSearch(true)}
                                >
                                    Cambiar
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre or DNI..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                        autoFocus
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPatientSearch(false)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                {pacientes.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {pacientes.map((p) => (
                                            <div
                                                key={p.id}
                                                className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                                onClick={() => {
                                                    setSelectedPatient(p)
                                                    setFormData({ ...formData, paciente_id: p.id })
                                                    setShowPatientSearch(false)
                                                    setSearchTerm('')
                                                }}
                                            >
                                                <p className="text-sm font-bold text-gray-900">{p.apellido}, {p.nombre}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">DNI: {p.numero_documento}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Profesional</label>
                        <select
                            value={formData.profesional_id}
                            onChange={(e) => setFormData({ ...formData, profesional_id: parseInt(e.target.value) })}
                            className="w-full border rounded-md p-2"
                            required
                        >
                            <option value="">Seleccionar profesional</option>
                            {profesionales.map((prof) => (
                                <option key={prof.id} value={prof.id}>
                                    {prof.apellido}, {prof.nombre} - {prof.especialidad}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <Input
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                        <Input
                            type="time"
                            value={formData.hora_inicio}
                            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hora Fin</label>
                        <Input
                            type="time"
                            value={formData.hora_fin}
                            onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado</label>
                        <select
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="Pendiente">Pendiente (Revisar seña)</option>
                            <option value="Creado">Creado</option>
                            <option value="Esperando confirmación">Esperando confirmación</option>
                            <option value="Confirmado por email">Confirmado por email</option>
                            <option value="Confirmado por SMS">Confirmado por SMS</option>
                            <option value="Confirmado por Whatsapp">Confirmado por Whatsapp</option>
                            <option value="En sala de espera">En sala de espera</option>
                            <option value="Atendiéndose">Atendiéndose</option>
                            <option value="Atendido">Atendido</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="Ausente">Ausente</option>
                            <option value="Ausente sin aviso">Ausente sin aviso</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            className="w-full border rounded-md p-2 h-24"
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                                try {
                                    setSendingReminder(true)
                                    await recordatoriosApi.enviar(appointment.id)
                                    alert('Recordatorio enviado correctamente')
                                } catch (error: any) {
                                    alert(error.message || 'Error al enviar recordatorio')
                                } finally {
                                    setSendingReminder(false)
                                }
                            }}
                            disabled={sendingReminder || !appointment.paciente?.email}
                            title={!appointment.paciente?.email ? 'El paciente no tiene email' : ''}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            {sendingReminder ? 'Enviando...' : 'Recordatorio'}
                        </Button>
                        <div className="flex space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </form>
                </div>
            </div>
        </div>
    )
}
