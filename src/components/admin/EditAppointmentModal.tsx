import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { turnosApi, adminApi, recordatoriosApi } from '../../api'
import type { Turno, Profesional } from '../../types'
import { Mail } from 'lucide-react'

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
        estado: appointment.estado,
        observaciones: appointment.observaciones || ''
    })
    const [loading, setLoading] = useState(false)
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [sendingReminder, setSendingReminder] = useState(false)

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Editar Turno</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Paciente</label>
                        <Input
                            type="text"
                            value={`${appointment.paciente?.apellido || ''}, ${appointment.paciente?.nombre || ''}`}
                            disabled
                            className="bg-gray-100"
                        />
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
    )
}
