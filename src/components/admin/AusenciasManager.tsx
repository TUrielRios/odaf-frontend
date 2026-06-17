import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, Trash2, User } from 'lucide-react';
import { ausenciasApi, Ausencia } from '../../api/ausencias';
import { profesionalesApi } from '../../api/profesionales';
import type { Profesional } from '../../types';

export const AusenciasManager: React.FC = () => {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    profesional_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
    es_recurrente: false,
    dia_semana: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ausenciasData, profesionalesData] = await Promise.all([
        ausenciasApi.listar(),
        profesionalesApi.listar({ limit: 100 })
      ]);
      setAusencias(ausenciasData || []);
      setProfesionales(profesionalesData.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de ausencia/vacaciones?')) return;
    
    try {
      await ausenciasApi.eliminar(id);
      setAusencias(ausencias.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar la ausencia');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.profesional_id || !formData.fecha_inicio || !formData.fecha_fin) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      await ausenciasApi.crear({
        profesional_id: Number(formData.profesional_id),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        hora_inicio: formData.hora_inicio || undefined,
        hora_fin: formData.hora_fin || undefined,
        motivo: formData.motivo,
        es_recurrente: formData.es_recurrente,
        dia_semana: formData.es_recurrente ? Number(formData.dia_semana) : undefined
      });

      setIsModalOpen(false);
      setFormData({ profesional_id: '', fecha_inicio: '', fecha_fin: '', hora_inicio: '', hora_fin: '', motivo: '', es_recurrente: false, dia_semana: '' });
      fetchData(); // Reload list
    } catch (err) {
      console.error('Error al crear:', err);
      alert('Error al crear el registro de ausencia');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando ausencias...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ausencias y Vacaciones</h2>
          <p className="text-gray-500 mt-1">Gestione los días no laborables de sus profesionales</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#026498] text-white px-6 py-3 rounded-2xl hover:bg-[#0c4a6e] transition-all font-bold shadow-lg shadow-blue-900/10"
        >
          <Plus size={20} />
          <span>Registrar Ausencia</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* List of Ausencias */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Profesional</th>
                <th className="px-6 py-4">Desde</th>
                <th className="px-6 py-4">Hasta</th>
                <th className="px-6 py-4">Motivo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ausencias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <CalendarOff className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No hay ausencias registradas</p>
                  </td>
                </tr>
              ) : (
                ausencias.map((ausencia) => (
                  <tr key={ausencia.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {ausencia.profesional ? `${ausencia.profesional.apellido}, ${ausencia.profesional.nombre}` : 'Desconocido'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(ausencia.fecha_inicio).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                      {ausencia.hora_inicio && <span className="block text-xs font-bold text-blue-600">{ausencia.hora_inicio.substring(0, 5)} hs</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {ausencia.es_recurrente ? (
                        <span className="font-bold text-blue-600">
                          Todos los {['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'][ausencia.dia_semana || 0]}
                        </span>
                      ) : (
                        new Date(ausencia.fecha_fin).toLocaleDateString('es-AR', { timeZone: 'UTC' })
                      )}
                      {ausencia.hora_fin && <span className="block text-xs font-bold text-blue-600">{ausencia.hora_fin.substring(0, 5)} hs</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                        {ausencia.motivo || 'No especificado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(ausencia.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Ausencia */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Registrar Ausencia</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Profesional *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.profesional_id}
                    onChange={(e) => setFormData({ ...formData, profesional_id: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium appearance-none"
                    required
                  >
                    <option value="">Seleccione un profesional</option>
                    {profesionales.map(p => (
                      <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Desde fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hasta fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                    required
                    min={formData.fecha_inicio}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Desde hora (Opcional)</label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hasta hora (Opcional)</label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl space-y-4 border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="es_recurrente"
                    checked={formData.es_recurrente}
                    onChange={(e) => setFormData({ ...formData, es_recurrente: e.target.checked })}
                    className="w-5 h-5 text-[#026498] rounded-md border-gray-300 focus:ring-[#026498]"
                  />
                  <label htmlFor="es_recurrente" className="text-sm font-bold text-gray-700">¿Es un bloqueo recurrente?</label>
                </div>

                {formData.es_recurrente && (
                  <div>
                    <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Día de la semana a bloquear</label>
                    <select
                      value={formData.dia_semana}
                      onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                      required={formData.es_recurrente}
                    >
                      <option value="">Seleccione un día</option>
                      <option value="1">Lunes</option>
                      <option value="2">Martes</option>
                      <option value="3">Miércoles</option>
                      <option value="4">Jueves</option>
                      <option value="5">Viernes</option>
                      <option value="6">Sábado</option>
                      <option value="0">Domingo</option>
                    </select>
                    <p className="mt-2 text-[10px] text-blue-500 italic font-medium">
                      * El profesional no estará disponible este día entre las fechas seleccionadas.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Motivo (Opcional)</label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Vacaciones, Licencia médica, etc."
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#026498] text-gray-700 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#026498] text-white rounded-xl font-bold hover:bg-[#0c4a6e] transition-colors shadow-lg shadow-blue-900/10"
                >
                  Guardar Ausencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
