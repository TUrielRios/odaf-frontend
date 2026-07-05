import { apiClient } from "../lib/api-client"
import type { Prestacion, CrearPrestacionData, PaginatedResponse } from "../types"

export const prestacionesApi = {
  async listar(params?: {
    page?: number
    limit?: number
    profesional_id?: number
    fecha_desde?: string
    fecha_hasta?: string
    estado?: string
  }): Promise<PaginatedResponse<Prestacion>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.profesional_id) queryParams.append("profesional_id", params.profesional_id.toString())
    if (params?.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde)
    if (params?.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta)
    if (params?.estado) queryParams.append("estado", params.estado)

    const endpoint = `/prestaciones${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await apiClient.get<{ prestaciones: Prestacion[]; pagination: any }>(endpoint)

    return {
      data: response.prestaciones,
      pagination: response.pagination,
    }
  },

  async obtener(id: number): Promise<Prestacion> {
    return apiClient.get<Prestacion>(`/prestaciones/${id}`)
  },

  async crear(data: CrearPrestacionData): Promise<Prestacion> {
    return apiClient.post<Prestacion>("/prestaciones", data)
  },

  async actualizar(id: number, data: Partial<CrearPrestacionData>): Promise<Prestacion> {
    return apiClient.put<Prestacion>(`/prestaciones/${id}`, data)
  },

  async eliminar(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/prestaciones/${id}`)
  },

  async listarPorProfesional(
    profesionalId: number,
    params?: { fecha_desde?: string; fecha_hasta?: string; estado?: string },
  ): Promise<PaginatedResponse<Prestacion>> {
    const queryParams = new URLSearchParams()
    if (params?.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde)
    if (params?.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta)
    if (params?.estado) queryParams.append("estado", params.estado)

    const endpoint = `/prestaciones/profesional/${profesionalId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await apiClient.get<{ prestaciones: Prestacion[]; pagination: any }>(endpoint)

    return {
      data: response.prestaciones,
      pagination: response.pagination,
    }
  },

  async recalcular(): Promise<{ message: string; total_revisadas: number; actualizadas: number; sin_precio_configurado: number }> {
    return apiClient.post("/prestaciones/recalcular", {})
  },
}
