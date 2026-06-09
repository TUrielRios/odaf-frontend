import { apiClient } from "../lib/api-client"

export const recordatoriosApi = {
  async enviar(turno_id: number, custom_message?: string): Promise<{ message: string; messageId?: string }> {
    return apiClient.post("/recordatorios/enviar", { turno_id, mensaje_personalizado: custom_message })
  },
  async enviarMasivo(fecha: string): Promise<{ message: string; enviados: number; errores: number; total: number }> {
    return apiClient.post("/recordatorios/enviar-masivo", { fecha })
  },
  async preview(data: { turno_id?: number; custom_template?: string }): Promise<{ html: string }> {
    return apiClient.post("/recordatorios/preview", data)
  },
  async obtenerTemplate(): Promise<{ template: string }> {
    return apiClient.get("/recordatorios/template")
  },
  async guardarTemplate(template: string): Promise<{ message: string; template: string }> {
    return apiClient.put("/recordatorios/template", { template })
  },
}
