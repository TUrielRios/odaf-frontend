import { apiClient } from "../lib/api-client"
import type { Procedimiento } from "../types"

export const procedimientosApi = {
  async listar(): Promise<Procedimiento[]> {
    return apiClient.get<Procedimiento[]>("/procedimientos")
  },
  async obtener(id: number): Promise<Procedimiento> {
    return apiClient.get<Procedimiento>(`/procedimientos/${id}`)
  },
  async crear(data: {
    nombre: string
    precio_ars: number
    precio_usd: number
    preciosObraSocial?: any[]
  }): Promise<Procedimiento> {
    return apiClient.post<Procedimiento>("/procedimientos", data)
  },
  async actualizar(
    id: number,
    data: {
      nombre: string
      precio_ars: number
      precio_usd: number
      preciosObraSocial?: any[]
    }
  ): Promise<Procedimiento> {
    return apiClient.put<Procedimiento>(`/procedimientos/${id}`, data)
  },
  async eliminar(id: number): Promise<void> {
    return apiClient.delete(`/procedimientos/${id}`)
  },
}
