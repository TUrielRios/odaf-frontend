import { apiClient } from "../lib/api-client"
import type { Presupuesto, CrearPresupuestoData } from "../types"

export const presupuestosApi = {
  listar: async (pacienteId: string | number): Promise<Presupuesto[]> => {
    return apiClient.get<Presupuesto[]>(`/presupuestos?paciente_id=${pacienteId}`)
  },

  obtener: async (id: number): Promise<Presupuesto> => {
    return apiClient.get<Presupuesto>(`/presupuestos/${id}`)
  },

  crear: async (data: CrearPresupuestoData): Promise<Presupuesto> => {
    return apiClient.post<Presupuesto>("/presupuestos", data)
  },

  actualizar: async (id: number, data: Partial<CrearPresupuestoData>): Promise<Presupuesto> => {
    return apiClient.put<Presupuesto>(`/presupuestos/${id}`, data)
  },

  eliminar: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/presupuestos/${id}`)
  },
}
