import { apiClient } from "../lib/api-client"
import type { AuthResponse, AuthUser, LoginData, RegisterData, ApiResponse } from "../types"

export interface UsuarioAdmin {
  id: number
  email: string
  nombre: string
  role: string
  profesional_id: number | null
  activo: boolean
  permisos_tabs: string[] | null
}

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", data)

    if (response.data?.token) {
      apiClient.setToken(response.data.token)
      return response.data
    }

    throw new Error("Invalid login response")
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", data)

    if (response.data) {
      return response.data
    }

    throw new Error("Invalid register response")
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>("/auth/me")

    if (response.data) {
      return response.data
    }

    throw new Error("Invalid user data response")
  },

  logout() {
    apiClient.clearToken()
  },

  async listarUsuarios(): Promise<UsuarioAdmin[]> {
    const response = await apiClient.get<{ data: UsuarioAdmin[] }>("/auth/usuarios")
    return response.data
  },

  async actualizarPermisosTabs(userId: number, permisos_tabs: string[] | null): Promise<UsuarioAdmin> {
    const response = await apiClient.put<{ data: UsuarioAdmin }>(`/auth/usuarios/${userId}/permisos-tabs`, { permisos_tabs })
    return response.data
  },
}
