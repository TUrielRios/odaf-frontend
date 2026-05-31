import { apiClient } from "../lib/api-client"
import type { PlanTratamiento, CrearPlanTratamientoData, TratamientoPlan } from "../types"

export const planesTratamientoApi = {
  listar: async (pacienteId: string | number): Promise<PlanTratamiento[]> => {
    return apiClient.get<PlanTratamiento[]>(`/planes-tratamiento?paciente_id=${pacienteId}`)
  },

  obtener: async (id: number): Promise<PlanTratamiento> => {
    return apiClient.get<PlanTratamiento>(`/planes-tratamiento/${id}`)
  },

  crear: async (data: CrearPlanTratamientoData): Promise<PlanTratamiento> => {
    return apiClient.post<PlanTratamiento>("/planes-tratamiento", data)
  },

  actualizar: async (id: number, data: Partial<CrearPlanTratamientoData>): Promise<PlanTratamiento> => {
    return apiClient.put<PlanTratamiento>(`/planes-tratamiento/${id}`, data)
  },

  eliminar: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/planes-tratamiento/${id}`)
  },

  // Tratamientos individuales dentro de un plan
  agregarTratamiento: async (
    planId: number,
    data: {
      procedimiento_id: number
      nomenclador: string
      fecha_inicio: string
      pieza_numero?: string
      pieza_superficies?: Record<string, string>
    }
  ): Promise<PlanTratamiento> => {
    return apiClient.post<PlanTratamiento>(`/planes-tratamiento/${planId}/tratamientos`, data)
  },

  actualizarTratamiento: async (
    planId: number,
    tratamientoId: number,
    data: Partial<TratamientoPlan>
  ): Promise<PlanTratamiento> => {
    return apiClient.put<PlanTratamiento>(
      `/planes-tratamiento/${planId}/tratamientos/${tratamientoId}`,
      data
    )
  },

  eliminarTratamiento: async (planId: number, tratamientoId: number): Promise<PlanTratamiento> => {
    return apiClient.delete<PlanTratamiento>(
      `/planes-tratamiento/${planId}/tratamientos/${tratamientoId}`
    )
  },
}

