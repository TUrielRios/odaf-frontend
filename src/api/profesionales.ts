import { apiClient } from "../lib/api-client"
import type {
  Profesional,
  CrearProfesionalData,
  PaginatedResponse,
  HorariosSemanales,
  HorariosResponse,
  HorariosDisponiblesResponse,
  Servicio,
  AsignarServicioData,
} from "../types"

export const profesionalesApi = {
  async listar(params?: {
    page?: number
    limit?: number
    search?: string
    estado?: string
  }): Promise<PaginatedResponse<Profesional>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.estado) queryParams.append("estado", params.estado)

    const endpoint = `/profesionales${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await apiClient.get<{ profesionales: Profesional[]; pagination: any }>(endpoint)

    return {
      data: response.profesionales,
      pagination: response.pagination,
    }
  },

  async obtener(id: number): Promise<Profesional> {
    return apiClient.get<Profesional>(`/profesionales/${id}`)
  },

  async crear(data: CrearProfesionalData): Promise<Profesional> {
    return apiClient.post<Profesional>("/profesionales", data)
  },

  async actualizar(id: number, data: Partial<CrearProfesionalData>): Promise<Profesional> {
    return apiClient.put<Profesional>(`/profesionales/${id}`, data)
  },

  async eliminar(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/profesionales/${id}`)
  },

  async obtenerHorarios(id: number): Promise<HorariosResponse> {
    return apiClient.get<HorariosResponse>(`/profesionales/${id}/horarios`)
  },

  async actualizarHorarios(id: number, horarios: HorariosSemanales): Promise<HorariosResponse & { message: string }> {
    return apiClient.put<HorariosResponse & { message: string }>(`/profesionales/${id}/horarios`, { horarios })
  },

  async obtenerHorariosDisponibles(id: number, fecha: string, isAdmin: boolean = false): Promise<HorariosDisponiblesResponse> {
    const queryParams = new URLSearchParams({ fecha })
    if (isAdmin) queryParams.append("isAdmin", "true")
    return apiClient.get<HorariosDisponiblesResponse>(
      `/profesionales/${id}/horarios-disponibles?${queryParams.toString()}`,
    )
  },

  async obtenerServicios(id: number): Promise<{ servicios: Servicio[] }> {
    return apiClient.get<{ servicios: Servicio[] }>(`/profesionales/${id}/servicios`)
  },

  async asignarServicios(id: number, data: AsignarServicioData): Promise<{ message: string; servicios: Servicio[] }> {
    return apiClient.post<{ message: string; servicios: Servicio[] }>(`/profesionales/${id}/servicios`, data)
  },

  async removerServicio(id: number, servicioId: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/profesionales/${id}/servicios/${servicioId}`)
  },
}
