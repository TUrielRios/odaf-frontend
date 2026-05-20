import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Plus, UserPlus, Search } from 'lucide-react'
import { PatientForm } from '../booking/PatientForm'
import { turnosApi, profesionalesApi, pacientesApi, serviciosApi } from '../../api'
import type { Profesional, Paciente, Servicio } from '../../types'

interface AdminAppointmentModalProps {
    onClose: () => void
    onCreate: () => void
    initialData?: Partial<{
        fecha: string
        hora_inicio: string
        hora_fin: string
        profesional_id: number
        sobre_turno: boolean
    }>
}

export const AdminAppointmentModal: React.FC<AdminAppointmentModalProps> = ({ onClose, onCreate, initialData }) => {
    const [formData, setFormData] = useState({
        paciente_id: '',
        profesional_id: initialData?.profesional_id || 0,
        servicio_id: 0,
        fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
        hora_inicio: initialData?.hora_inicio || '10:00',
        hora_fin: initialData?.hora_fin || '10:30',
        estado: 'Creado',
        observaciones: '',
        sobre_turno: initialData?.sobre_turno || false
    })

    const [loading, setLoading] = useState(false)
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [servicios, setServicios] = useState<Servicio[]>([])
    const [searchPaciente, setSearchPaciente] = useState('')
    const [isNewPatient, setIsNewPatient] = useState(false)
    const [horaFinManual, setHoraFinManual] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profesionalesRes, pacientesRes, serviciosRes] = await Promise.all([
                    profesionalesApi.listar({ limit: 100, estado: 'Activo' }),
                    pacientesApi.listar({ limit: 50 }),
                    serviciosApi.listar()
                ])
                setProfesionales(profesionalesRes.data || [])
                setPacientes(pacientesRes.data || [])
                setServicios(serviciosRes.data || [])
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }
        fetchInitialData()
    }, [])

    useEffect(() => {
        const fetchPacientes = async () => {
            if (searchPaciente.length > 2) {
                try {
                    const response = await pacientesApi.listar({ search: searchPaciente, limit: 10 });
                    setPacientes(response.data || [])
                } catch (error) {
                    console.error('Error fetching patients:', error)
                }
            }
        }
        const delayDebounceFn = setTimeout(() => {
            fetchPacientes()
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchPaciente])

    // Auto-suggest end time based on service duration ONLY if not manually edited
    useEffect(() => {
        if (horaFinManual) return // Don't override manual selection
        if (formData.servicio_id && formData.hora_inicio) {
            const servicio = servicios.find(s => s.id === formData.servicio_id)
            if (servicio) {
                const duration = servicio.duracion_estimada || 30
                const [hours, minutes] = formData.hora_inicio.split(':').map(Number)
                const date = new Date()
                date.setHours(hours, minutes + duration, 0)
                const endHours = String(date.getHours()).padStart(2, '0')
                const endMinutes = String(date.getMinutes()).padStart(2, '0')
                setFormData(prev => ({ ...prev, hora_fin: `${endHours}:${endMinutes}` }))
            }
        }
    }, [formData.servicio_id, formData.hora_inicio, servicios, horaFinManual])

    const handleNewPatientSubmit = async (data: any) => {
        setLoading(true)
        try {
            const patientData = {
                ...data,
                condicion: data.condicion || 'Activo',
                tipo_facturacion: data.tipo_facturacion || 'B',
            }
            const newPatient = await pacientesApi.crear(patientData)
            await turnosApi.crear({
                paciente_id: newPatient.id,
                profesional_id: formData.profesional_id,
                servicio_id: formData.servicio_id,
                fecha: formData.fecha,
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                estado: formData.estado,
                observaciones: formData.observaciones,
                sobre_turno: formData.sobre_turno
            })
            onCreate()
            onClose()
        } catch (error: any) {
            console.error('Error creating patient and appointment:', error)
            const msg = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.msg || error?.message || 'Error al crear el paciente o el turno.'
            alert(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isNewPatient) return // Handled by PatientForm

        setLoading(true)
        
        if (!formData.paciente_id || !formData.profesional_id || !formData.servicio_id) {
            alert('Por favor complete todos los campos requeridos.')
            setLoading(false)
            return
        }

        try {
            await turnosApi.crear({
                paciente_id: formData.paciente_id,
                profesional_id: formData.profesional_id,
                servicio_id: formData.servicio_id,
                fecha: formData.fecha,
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                estado: formData.estado,
                observaciones: formData.observaciones,
                sobre_turno: formData.sobre_turno
            })
            onCreate()
            onClose()
        } catch (error: any) {
            console.error('Error creating appointment:', error)
            const errorMessage = error.response?.data?.error || 'Error al crear el turno. Verifique solapamientos o habilitar Sobre Turno.'
            alert(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-500">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 my-8 relative animate-in fade-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Plus className="w-6 h-6 rotate-45" />
                </button>

                <h3 className="text-2xl font-black mb-6 text-[#026498] flex items-center tracking-tight">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3 text-[#026498]">
                        <Plus className="w-6 h-6" />
                    </div>
                    Agregar Sobreturno
                </h3>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Paciente *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsNewPatient(!isNewPatient)}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#026498] hover:underline flex items-center gap-1"
                                >
                                    {isNewPatient ? (
                                        <><Search size={12} /> Usar Existente</>
                                    ) : (
                                        <><UserPlus size={12} /> Paciente Nuevo</>
                                    )}
                                </button>
                            </div>

                            {isNewPatient ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-[10px] text-amber-600 font-bold mb-4 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        * El paciente se registrará automáticamente al guardar el turno.
                                    </p>
                                    {/* We will render the form at the bottom if isNewPatient is true, 
                                        or we can render it here but PatientForm has its own submit button.
                                        Let's keep it consistent. */}
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Buscar por DNI, nombre o apellido..."
                                            value={searchPaciente}
                                            onChange={(e) => {
                                                setSearchPaciente(e.target.value);
                                                setFormData({ ...formData, paciente_id: '' });
                                            }}
                                            className="h-12 pr-10"
                                            required={!isNewPatient}
                                        />
                                        {formData.paciente_id && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" title="Paciente seleccionado" />
                                            </div>
                                        )}
                                    </div>

                                    {searchPaciente.length > 2 && !formData.paciente_id && pacientes.length > 0 && (
                                        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {pacientes.map((paciente) => (
                                                <div
                                                    key={paciente.id}
                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                                                    onClick={() => {
                                                        setFormData({ ...formData, paciente_id: paciente.id });
                                                        setSearchPaciente(`${paciente.numero_documento} - ${paciente.apellido}, ${paciente.nombre}`);
                                                    }}
                                                >
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {paciente.apellido}, {paciente.nombre}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        DNI: {paciente.numero_documento}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {searchPaciente.length > 2 && !formData.paciente_id && pacientes.length === 0 && (
                                        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center text-sm text-gray-500">
                                            No se encontraron pacientes
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Profesional</label>
                                    <select
                                        value={formData.profesional_id || ''}
                                        onChange={(e) => setFormData({ ...formData, profesional_id: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-xl p-3 h-12 bg-white text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none transition-all"
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
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Servicio</label>
                                    <select
                                        value={formData.servicio_id || ''}
                                        onChange={(e) => setFormData({ ...formData, servicio_id: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-xl p-3 h-12 bg-white text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none transition-all"
                                        required
                                    >
                                        <option value="">Seleccionar servicio</option>
                                        {servicios.map((serv) => (
                                            <option key={serv.id} value={serv.id}>
                                                {serv.nombre} ({serv.duracion_estimada} min)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-50">
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#026498] mb-2">Fecha</label>
                                <Input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    required
                                    className="h-11 border-blue-100"
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#026498] mb-2">Inicio</label>
                                <Input
                                    type="time"
                                    value={formData.hora_inicio}
                                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                    required
                                    className="h-11 border-blue-100"
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#026498] mb-2">Fin</label>
                                <Input
                                    type="time"
                                    value={formData.hora_fin}
                                    onChange={(e) => {
                                        setHoraFinManual(true)
                                        setFormData({ ...formData, hora_fin: e.target.value })
                                    }}
                                    required
                                    className="h-11 border-blue-100"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center animate-pulse-subtle">
                            <input
                                type="checkbox"
                                id="sobre_turno"
                                checked={formData.sobre_turno}
                                onChange={(e) => setFormData({ ...formData, sobre_turno: e.target.checked })}
                                className="mr-4 w-6 h-6 text-red-600 rounded-lg focus:ring-red-500 border-red-200 transition-all cursor-pointer"
                            />
                            <label htmlFor="sobre_turno" className="text-sm font-black text-red-900 cursor-pointer flex-1">
                                Ignorar Reglas / Forzar (Sobre Turno)
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estado</label>
                                <select
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-3 h-12 bg-white text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none transition-all"
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Confirmado">Confirmado</option>
                                    <option value="Creado">Creado</option>
                                    <option value="En sala de espera">En sala de espera</option>
                                    <option value="Atendiéndose">Atendiéndose</option>
                                    <option value="Atendido">Atendido</option>
                                    <option value="Cancelado">Cancelado</option>
                                    <option value="Ausente">Ausente</option>
                                    <option value="Ausente sin aviso">Ausente sin aviso</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Observaciones</label>
                                <textarea
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-3 h-12 bg-white text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>
                    </div>

                    {isNewPatient ? (
                        <div className="border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h4 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                                <UserPlus size={16} className="text-[#026498]" />
                                Formulario de Nuevo Paciente
                            </h4>
                            <PatientForm
                                onPatientData={handleNewPatientSubmit}
                                loading={loading}
                                submitButtonText="Agendar Sobreturno"
                            />
                        </div>
                    ) : (
                        <div className="flex gap-4 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose}
                                className="flex-1 h-12 rounded-xl font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="button" 
                                onClick={handleSubmit}
                                disabled={loading} 
                                className="flex-1 h-12 rounded-xl bg-[#026498] text-white font-black shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                {loading ? 'Guardando...' : 'Agregar Sobreturno'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
