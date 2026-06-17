const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

export interface LoginResponse {
  token: string
  usuario: {
    id: string
    email: string
    pacienteId: string
    nombre: string
    apellido: string
  }
}

export interface PacienteProfile {
  paciente: {
    id: string
    nombre: string
    apellido: string
    tipo_documento: string
    numero_documento: string
    fecha_nacimiento: string
    sexo: string
    email: string
    telefono: string
    direccion: string
    obraSocial: string | null
  }
  proximoTurno: any
  turnos: any[]
  historialClinico: any[]
  planesTratamiento: any[]
  archivos: any[]
  estadisticas: {
    totalTurnos: number
    turnosCompletados: number
    turnosCancelados: number
    turnosPendientes: number
  }
}

export const patientPortalApi = {
  buscarPorEmail: async (email: string): Promise<{ existe: boolean; usuario: { email: string; paciente_id: string } | null }> => {
    const response = await fetch(`${API_BASE_URL}/usuarios-pacientes/buscar/${encodeURIComponent(email)}`)
    if (!response.ok) throw new Error("Error al buscar usuario")
    return response.json()
  },

  login: async (email: string, dni: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/usuarios-pacientes/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, dni }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Credenciales invalidas")
    }
    return response.json()
  },

  registro: async (email: string, dni: string, paciente_id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/usuarios-pacientes/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, dni, paciente_id }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Error al registrar")
    }
  },

  obtenerPerfil: async (): Promise<PacienteProfile> => {
    const token = localStorage.getItem("patientToken")
    if (!token) throw new Error("No hay sesion activa")

    const response = await fetch(`${API_BASE_URL}/usuarios-pacientes/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error("Error al obtener perfil")
    return response.json()
  },

  obtenerMisTurnos: async (): Promise<any[]> => {
    const token = localStorage.getItem("patientToken")
    if (!token) throw new Error("No hay sesion activa")

    const response = await fetch(`${API_BASE_URL}/turnos/mis-turnos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error("Error al obtener turnos")
    return response.json()
  },

  obtenerTurno: async (id: number): Promise<any> => {
    const token = localStorage.getItem("patientToken")

    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (token) headers["Authorization"] = `Bearer ${token}`

    const response = await fetch(`${API_BASE_URL}/turnos/${id}`, {
      headers,
    })
    if (!response.ok) throw new Error("Error al obtener turno")
    return response.json()
  },

  cancelarTurno: async (id: number): Promise<void> => {
    const token = localStorage.getItem("patientToken")
    if (!token) throw new Error("No hay sesion activa")

    const response = await fetch(`${API_BASE_URL}/turnos/${id}/cancelar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Error al cancelar turno")
    }
  },

  reprogramarTurno: async (id: number, fecha: string, hora_inicio: string, hora_fin: string): Promise<any> => {
    const token = localStorage.getItem("patientToken")
    if (!token) throw new Error("No hay sesion activa")

    const response = await fetch(`${API_BASE_URL}/turnos/${id}/reprogramar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fecha, hora_inicio, hora_fin }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Error al reprogramar turno")
    }
    return response.json()
  },

  obtenerHorariosDisponibles: async (profesionalId: number, fecha: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/profesionales/${profesionalId}/horarios?fecha=${fecha}`)
    if (!response.ok) throw new Error("Error al obtener horarios")
    return response.json()
  },
}

export const setPatientToken = (token: string) => {
  localStorage.setItem("patientToken", token)
}

export const clearPatientToken = () => {
  localStorage.removeItem("patientToken")
}

export const getPatientToken = () => {
  return localStorage.getItem("patientToken")
}
