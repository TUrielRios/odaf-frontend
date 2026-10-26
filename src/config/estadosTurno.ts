/**
 * Fuente única de los estados de un turno para todo el frontend.
 *
 * Si agregás o renombrás un estado acá, replicalo en
 * `backend/src/config/estadosTurno.js`: el validador del `PUT /turnos/:id`
 * usa esa lista y rechaza con 400 cualquier estado que no figure en ella.
 * Son dos paquetes separados, por eso la lista existe de los dos lados.
 */

/** Estados que el usuario puede elegir en los selectores de turno, en orden de flujo. */
export const ESTADOS_TURNO = [
  "Pendiente",
  "Primera vez",
  "Creado",
  "Esperando confirmación",
  "Confirmado",
  "Confirmado por email",
  "Confirmado por SMS",
  "Confirmado por Whatsapp",
  "En sala de espera",
  "Atendiéndose",
  "Atendido",
  "Cancelado",
  "Ausente sin aviso",
] as const

export type EstadoTurno = (typeof ESTADOS_TURNO)[number]

/** Color de cada estado en el calendario. Cubre también los estados legacy que siguen en la base. */
export const STATUS_COLORS: Record<string, string> = {
  "Pendiente": "#F97316", // Orange
  "Primera vez": "#A21CAF", // Bordo (magenta oscuro)
  "Creado": "#3B82F6", // Blue
  "Esperando confirmación": "#EAB308", // Yellow
  "Confirmado": "#22C55E", // Green
  "Confirmado por email": "#22C55E", // Green
  "Confirmado por SMS": "#22C55E", // Green
  "Confirmado por Whatsapp": "#22C55E", // Green
  "En sala de espera": "#A855F7", // Purple
  "Atendiéndose": "#EC4899", // Pink
  "Atendido": "#06B6D4", // Cyan
  "Cancelado": "#EF4444", // Red
  "Ausente sin aviso": "#000000", // Black
}

/**
 * Estados que no se muestran en la leyenda del calendario: las tres variantes de
 * "Confirmado por" comparten el verde de "Confirmado", y "Esperando confirmación"
 * quedó fuera de la leyenda histórica aunque tenga su propio amarillo.
 */
const ESTADOS_FUERA_DE_LEYENDA: string[] = [
  "Confirmado por email",
  "Confirmado por SMS",
  "Confirmado por Whatsapp",
  "Esperando confirmación",
]

/** Leyenda del calendario, en el mismo orden que ESTADOS_TURNO. */
export const LEGEND_ENTRIES: [string, string][] = ESTADOS_TURNO.filter(
  (estado) => !ESTADOS_FUERA_DE_LEYENDA.includes(estado),
).map((estado) => [estado, STATUS_COLORS[estado]])

/**
 * Colores sobre los que el texto del chip tiene que ir en negro.
 * El resto son lo bastante oscuros como para leerse mejor en blanco.
 */
const COLORES_CLAROS = ["#F97316", "#EAB308", "#22C55E"]

export const esColorClaro = (color: string): boolean => COLORES_CLAROS.includes(color)
