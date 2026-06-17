import { apiClient } from "../lib/api-client"
import type { Archivo } from "../types"

export const archivosApi = {
  listar: async (pacienteId: string | number): Promise<Archivo[]> => {
    return apiClient.get<Archivo[]>(`/archivos?paciente_id=${pacienteId}`)
  },

  obtener: async (id: number): Promise<Archivo> => {
    return apiClient.get<Archivo>(`/archivos/${id}`)
  },

  subir: async (file: File, pacienteId: string | number, descripcion?: string): Promise<Archivo> => {
    return apiClient.uploadFile<Archivo>("/archivos", file, {
      paciente_id: pacienteId,
      descripcion: descripcion || "",
    })
  },

  actualizar: async (id: number, data: { descripcion?: string }): Promise<Archivo> => {
    return apiClient.put<Archivo>(`/archivos/${id}`, data)
  },

  eliminar: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/archivos/${id}`)
  },
}
