import { apiClient } from "../lib/api-client"
import type {
  Liquidacion,
  CrearLiquidacionData,
  PaginatedResponse,
  PagarLiquidacionData,
  ActualizarComisionData,
} from "../types"

export const liquidacionesApi = {
  async listar(params?: {
    page?: number
    limit?: number
    profesional_id?: number
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
  }): Promise<PaginatedResponse<Liquidacion>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.profesional_id) queryParams.append("profesional_id", params.profesional_id.toString())
    if (params?.estado) queryParams.append("estado", params.estado)
    if (params?.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde)
    if (params?.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta)

    const endpoint = `/liquidaciones${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await apiClient.get<{ liquidaciones: Liquidacion[]; pagination: any }>(endpoint)

    return {
      data: response.liquidaciones,
      pagination: response.pagination,
    }
  },

  async obtener(id: number): Promise<Liquidacion> {
    return apiClient.get<Liquidacion>(`/liquidaciones/${id}`)
  },

  async crear(data: CrearLiquidacionData): Promise<Liquidacion> {
    return apiClient.post<Liquidacion>("/liquidaciones", data)
  },

  async actualizar(id: number, data: Partial<CrearLiquidacionData>): Promise<Liquidacion> {
    return apiClient.put<Liquidacion>(`/liquidaciones/${id}`, data)
  },

  async eliminar(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/liquidaciones/${id}`)
  },

  async pagar(id: number, data: PagarLiquidacionData): Promise<Liquidacion> {
    return apiClient.put<Liquidacion>(`/liquidaciones/${id}/pagar`, data)
  },

  async anular(id: number, motivo: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/liquidaciones/${id}/anular`, { motivo })
  },

  async obtenerResumen(profesionalId: number, params?: { fecha_desde?: string; fecha_hasta?: string }): Promise<{
    total_liquidado: number
    total_pendiente: number
    total_pagado: number
    cantidad_prestaciones: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.fecha_desde) queryParams.append("fecha_desde", params.fecha_desde)
    if (params?.fecha_hasta) queryParams.append("fecha_hasta", params.fecha_hasta)

    return apiClient.get<{
      total_liquidado: number
      total_pendiente: number
      total_pagado: number
      cantidad_prestaciones: number
    }>(`/liquidaciones/profesional/${profesionalId}/resumen${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
  },

  async actualizarComision(profesionalId: number, data: ActualizarComisionData): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/profesionales/${profesionalId}/comision`, data)
  },

  async simular(data: {
    profesional_id: number
    periodo: string
    tipo: string
    obra_social_id?: number
    fecha_custom_inicio?: string
    fecha_custom_fin?: string
  }): Promise<{
    periodo_inicio: string
    periodo_fin: string
    cantidad_prestaciones: number
    monto_total_servicios: string
    monto_profesional: string
    prestaciones: any[]
  }> {
    return apiClient.post("/liquidaciones/simular", data)
  },
}
