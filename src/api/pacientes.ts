import { apiClient } from "../lib/api-client"
import type { Paciente, CrearPacienteData, PaginationResponse } from "../types"

export const pacientesApi = {
  listar: async (params?: {
    page?: number
    limit?: number
    search?: string
    mes_nacimiento?: number
  }): Promise<PaginationResponse<Paciente>> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", String(params.page))
    if (params?.limit) queryParams.append("limit", String(params.limit))
    if (params?.search) queryParams.append("search", params.search)
    if (params?.mes_nacimiento) queryParams.append("mes_nacimiento", String(params.mes_nacimiento))

    const query = queryParams.toString()
    const response = await apiClient.get<any>(`/pacientes${query ? `?${query}` : ""}`)

    return {
      data: response.pacientes || [],
      pagination: {
        currentPage: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.total || 0,
        itemsPerPage: response.pagination?.limit || 10,
      }
    }
  },

  obtener: async (id: string): Promise<Paciente> => {
    return apiClient.get<Paciente>(`/pacientes/${id}`)
  },

  crear: async (data: CrearPacienteData): Promise<Paciente> => {
    return apiClient.post<Paciente>("/pacientes", data)
  },

  buscarPorDocumento: async (numeroDocumento: string): Promise<Paciente | null> => {
    try {
      return await apiClient.get<Paciente>(`/pacientes/documento/${numeroDocumento}`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  actualizar: async (id: string, data: Partial<CrearPacienteData>): Promise<Paciente> => {
    return apiClient.put<Paciente>(`/pacientes/${id}`, data)
  },

  eliminar: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/pacientes/${id}`)
  },
}
