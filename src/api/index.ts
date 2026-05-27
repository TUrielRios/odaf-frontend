// Exportar todas las APIs
export * from "./auth"
export * from "./pacientes"
export * from "./profesionales"
export * from "./servicios"
export * from "./turnos"
export * from "./admin"
export { historialesClinicosApi } from "./historiales-clinicos"
export { odontogramasApi } from "./odontogramas"
export { prescripcionesApi } from "./prescripciones"
export { planesTratamientoApi } from "./planes-tratamiento"
export { archivosApi } from "./archivos"
export { obrasSocialesApi } from "./obras-sociales"
export { copagosApi } from "./copagos"
export { feriadosApi } from "./feriados"
export { recordatoriosApi } from "./recordatorios"
export { presupuestosApi } from "./presupuestos"
export { procedimientosApi } from "./procedimientos"


// Re-exportar el cliente para uso directo si es necesario
export { apiClient } from "../lib/api-client"
