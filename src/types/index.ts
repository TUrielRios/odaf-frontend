// Base types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Auth types
export interface AuthUser {
  id: number
  email: string
  nombre: string
  role?: string
  permisos_tabs?: string[] | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  nombre: string
}

// Paciente types
// En types/index.ts o types.ts
export interface Paciente {
  id: string
  apellido: string
  nombre: string
  tipo_documento: 'DNI' | 'Pasaporte' | 'Cédula'
  numero_documento: string
  obra_social_id?: number
  condicion: string
  fecha_nacimiento: string
  sexo: 'Masculino' | 'Femenino' | 'Otro'
  direccion?: string
  telefono?: string
  email?: string
  ocupacion?: string
  recomendado_por?: string
  condicion_iva?: string
  numero_afiliado?: string
  foto_url?: string
  contacto_emergencia?: string
  telefono_emergencia?: string
  tipo_facturacion: 'A' | 'B' | 'C'
  numero_facturacion?: string
  etiquetas?: string[]
  informacion_adicional?: string
  createdAt: string
  updatedAt: string

  // Relaciones
  obraSocial?: {
    id: number
    nombre: string
  }
  presupuestos?: Presupuesto[]
}

export interface CrearPacienteData {
  apellido: string
  nombre: string
  tipo_documento: 'DNI' | 'Pasaporte' | 'Cédula'
  numero_documento: string
  obra_social_id?: number
  condicion?: string
  fecha_nacimiento: string
  sexo: 'Masculino' | 'Femenino' | 'Otro'
  direccion?: string
  telefono?: string
  email?: string
  ocupacion?: string
  recomendado_por?: string
  condicion_iva?: string
  tipo_facturacion?: 'A' | 'B' | 'C'
  numero_facturacion?: string
  etiquetas?: string[]
  informacion_adicional?: string
  numero_afiliado?: string
  contacto_emergencia?: string
  telefono_emergencia?: string
  observaciones?: string
}

// Profesional types
export interface Profesional {
  id: number
  nombre: string
  apellido: string
  numero_documento: string
  numero_matricula: string
  especialidad: string
  telefono?: string
  email?: string
  direccion?: string
  horarios_atencion?: HorariosSemanales
  estado: "Activo" | "Inactivo" | "Suspendido"
  observaciones?: string
  createdAt: string
  updatedAt: string
  servicios?: Servicio[]
  porcentaje_comision?: number
  color?: string
  foto_url?: string
}

export interface CrearProfesionalData {
  nombre: string
  apellido: string
  numero_documento: string
  numero_matricula: string
  especialidad: string
  telefono?: string
  email?: string
  direccion?: string
  color?: string
  horarios_atencion?: HorariosSemanales
  estado?: string
  observaciones?: string
  foto_url?: string
  porcentaje_comision?: number
}

export interface HorarioAtencion {
  inicio: string
  fin: string
  activo: boolean
}

export interface RangoHorario {
  inicio: string
  fin: string
}

export interface HorarioDia {
  activo: boolean
  rangos: RangoHorario[]
  frecuencia?: 'semanal' | 'quincenal'
  semana_inicio?: 0 | 1 // 0 = Semana 1, 1 = Semana 2
}

export interface HorariosSemanales {
  lunes: HorarioDia
  martes: HorarioDia
  miercoles: HorarioDia
  jueves: HorarioDia
  viernes: HorarioDia
  sabado: HorarioDia
  domingo: HorarioDia
  dias_especificos?: Record<string, HorarioDia>
}

// Servicio types
export interface Servicio {
  id: number
  nombre: string
  descripcion?: string
  categoria: string
  precio_base: number
  duracion_estimada: number
  estado: string
  createdAt: string
  updatedAt: string
  subServicios?: SubServicio[]
  profesionales?: Profesional[]
}

export interface SubServicio {
  id: number
  servicio_id: number
  nombre: string
  descripcion?: string
  precio: number
  duracion_estimada: number
  estado: string
  createdAt: string
  updatedAt: string
}

export interface CrearServicioData {
  nombre: string
  descripcion?: string
  categoria: string
  precio_base: number
  duracion_estimada: number
  estado?: string
}

export interface CrearSubServicioData {
  servicio_id: number
  nombre: string
  descripcion?: string
  precio: number
  duracion_estimada: number
  estado?: string
}

// Turno types
export interface Turno {
  id: number
  paciente_id: string
  profesional_id: number
  servicio_id: number
  subservicio_id?: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  observaciones?: string
  pago_confirmado?: boolean
  precio_final?: number
  createdAt: string
  updatedAt: string
  paciente?: Paciente
  profesional?: Profesional
  servicio?: Servicio
  subservicio?: SubServicio
  agendado_por?: string
}

export interface CrearTurnoData {
  paciente_id: string
  profesional_id: number
  servicio_id: number
  subservicio_id?: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  observaciones?: string
  pago_confirmado?: boolean
  precio_final?: number
  estado?: string
  sobre_turno?: boolean
  agendado_por?: string
}

export interface CrearTurnoBookingData {
  paciente_id: string
  profesional_id: number
  servicio_id: number
  fecha_hora: string
  duracion_minutos: number
}

export interface DisponibilidadResponse {
  disponible: boolean
  mensaje: string
}

// Obra Social types
export interface ObraSocial {
  id: number
  nombre: string
  codigo?: string
  telefono?: string
  email?: string
  activo: boolean
}

export interface Copago {
  id: number
  servicio_id: number
  obra_social_id: number
  monto: number
  servicio?: {
    nombre: string
  }
  obraSocial?: {
    nombre: string
  }
}

export interface HistorialClinico {
  id: number
  paciente_id: string
  fecha: string
  motivo_consulta?: string
  enfermedad_actual?: string
  antecedentes_personales?: string
  antecedentes_familiares?: string
  examen_fisico?: string
  diagnostico?: string
  tratamiento?: string
  observaciones?: string
  createdAt?: string
  updatedAt?: string
}

export interface CrearHistorialClinicoData {
  paciente_id: string
  fecha: string
  motivo_consulta?: string
  enfermedad_actual?: string
  antecedentes_personales?: string
  antecedentes_familiares?: string
  examen_fisico?: string
  diagnostico?: string
  tratamiento?: string
  observaciones?: string
}

export interface Odontograma {
  id: number
  paciente_id: string
  profesional_id: number
  fecha: string
  dientes_data: Record<string, any>
  observaciones?: string
  tipo: "Inicial" | "Control" | "Tratamiento"
  createdAt?: string
  updatedAt?: string
}

export interface CrearOdontogramaData {
  paciente_id: string
  profesional_id: number
  fecha: string
  dientes_data: Record<string, any>
  observaciones?: string
  tipo: "Inicial" | "Control" | "Tratamiento"
}

export interface Prescripcion {
  id: number
  paciente_id: string
  fecha: string
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones?: string
  createdAt?: string
  updatedAt?: string
}

export interface CrearPrescripcionData {
  paciente_id: string
  fecha: string
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones?: string
}

export interface TratamientoPlan {
  id: number
  plan_tratamiento_id: number
  procedimiento_id: number
  profesional_id?: number | null
  nomenclador: string
  pieza_numero?: string | null
  pieza_superficies?: Record<string, string> | null
  fecha_inicio: string
  estado: "Pendiente" | "Comenzado" | "Cancelado" | "Terminado"
  precio_paciente: number
  cobertura_obra_social: number
  autorizado: boolean
  observaciones?: string | null
  createdAt?: string
  updatedAt?: string
  procedimiento?: {
    id: number
    nombre: string
    precio_ars: number
    precio_usd: number
  }
  profesional?: {
    id: number
    nombre: string
    apellido: string
    especialidad: string
  } | null
}

export interface PlanTratamiento {
  id: number
  paciente_id: string
  profesional_id?: number
  obra_social_id?: number
  fecha_creacion?: string
  fecha_inicio: string
  fecha_fin?: string
  fecha_fin_estimada?: string
  descripcion: string
  estado: "Planificado" | "Pendiente" | "En_Progreso" | "Completado" | "Cancelado"
  costo_estimado?: number
  costo_total?: number
  costo_obra_social?: number
  costo_paciente?: number
  tratamientos?: TratamientoPlan[]
  tratamientosItems?: TratamientoPlan[]
  observaciones?: string
  createdAt?: string
  updatedAt?: string
  paciente?: {
    id: string
    nombre: string
    apellido: string
    numero_documento: string
    obra_social_id?: number
  }
  profesional?: {
    id: number
    nombre: string
    apellido: string
    especialidad: string
  }
  obraSocial?: {
    id: number
    nombre: string
    plan?: string
  }
}

export interface CrearPlanTratamientoData {
  paciente_id: string | number
  profesional_id?: number
  obra_social_id?: number
  fecha_inicio: string
  fecha_fin?: string
  descripcion: string
  estado: "Planificado" | "Pendiente" | "En_Progreso" | "Completado" | "Cancelado"
  costo_estimado?: number
  observaciones?: string
}

export interface Archivo {
  id: number
  paciente_id: string
  nombre: string
  tipo: string
  ruta: string
  descripcion?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginationResponse<T> {
  data: T[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export interface ProfesionalServicio {
  profesional_id: number
  servicio_id: number
  estado: string
  createdAt: string
  updatedAt: string
}

export interface AsignarServicioData {
  servicio_ids: number[]
}

// Prestacion and Liquidacion types
export interface Prestacion {
  id: number
  turno_id: number
  profesional_id: number
  servicio_id: number
  subservicio_id?: number
  fecha: string
  monto_total: number
  porcentaje_profesional: number
  monto_profesional: number
  estado: string
  observaciones?: string
  liquidacion_id?: number
  createdAt: string
  updatedAt: string
  turno?: Turno
  profesional?: Profesional
  servicio?: Servicio
  subservicio?: SubServicio
  liquidacion?: Liquidacion
}

export interface CrearPrestacionData {
  turno_id: number
  profesional_id: number
  servicio_id: number
  subservicio_id?: number
  fecha: string
  monto_total: number
  porcentaje_profesional: number
  estado?: string
  observaciones?: string
}

export interface Liquidacion {
  id: number
  profesional_id: number
  periodo_inicio: string
  periodo_fin: string
  monto_total_servicios: number
  monto_profesional: number
  cantidad_prestaciones: number
  estado: string
  fecha_pago?: string
  metodo_pago?: string
  observaciones?: string
  createdAt: string
  updatedAt: string
  profesional?: Profesional
  prestaciones?: Prestacion[]
  // Legacy fields compatibility if needed, or remove them
  fecha_desde?: string
  fecha_hasta?: string
  monto_total?: number
}

export interface CrearLiquidacionData {
  profesional_id: number
  periodo_inicio: string
  periodo_fin: string
  observaciones?: string
  monto_custom?: number
  tipo?: string
  obra_social_id?: number
}

export interface PagarLiquidacionData {
  metodo_pago: string
  fecha_pago?: string
  observaciones?: string
}

export interface ActualizarComisionData {
  porcentaje_comision: number
}

export interface HorariosResponse {
  horarios: HorariosSemanales
}

export interface HorariosDisponiblesResponse {
  fecha: string
  horarios_disponibles: string[]
  disponible?: boolean
  mensaje?: string
}

export interface MovimientoCuenta {
  id: number
  paciente_id: string
  fecha: string
  tipo: 'Ingreso' | 'Deuda'
  monto: string
  forma_pago?: string
  descripcion?: string
  createdAt: string
  updatedAt: string
}

export interface PresupuestoItem {
  descripcion: string
  cantidad: number
  precio_unitario: number
  total: number
}

export interface Presupuesto {
  id: number
  paciente_id: string
  profesional_id?: number
  fecha: string
  descripcion?: string
  items: PresupuestoItem[]
  monto_total: number | string
  estado: string
  observaciones?: string
  createdAt: string
  updatedAt: string
  paciente?: Paciente
  profesional?: Profesional
}

export interface CrearPresupuestoData {
  paciente_id: string
  profesional_id?: number
  fecha: string
  descripcion?: string
  items: PresupuestoItem[]
  monto_total: number
  estado?: string
  observaciones?: string
}

export interface Procedimiento {
  id: number
  nombre: string
  precio_ars: number
  precio_usd: number
  createdAt: string
  updatedAt: string
  preciosObraSocial?: ProcedimientoPrecioObraSocial[]
}

export interface ProcedimientoPrecioObraSocial {
  id: number
  procedimiento_id: number
  obra_social_id: number
  codigo?: string
  precio_paciente?: number
  usar_precio_particular: boolean
  cobertura?: number
  precio_sugerido?: number
  createdAt: string
  updatedAt: string
  obraSocial?: {
    id: number
    nombre: string
  }
}


