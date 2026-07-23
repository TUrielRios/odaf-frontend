import { describe, it, expect } from 'vitest'
import { cleanPhone, formatWhatsAppMessage, getInitialEmailText } from '@/lib/recordatorio'
import type { Turno } from '@/types'

const baseTurno = {
  id: 1,
  paciente_id: 'p1',
  profesional_id: 1,
  servicio_id: 1,
  fecha: '2026-07-20',
  hora_inicio: '10:00',
  hora_fin: '10:30',
  estado: 'Confirmado',
  createdAt: '2026-07-10T13:00:00.000Z',
  updatedAt: '2026-07-10T13:00:00.000Z',
  paciente: {
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '1140483693',
    email: 'juan@example.com',
  },
  profesional: { nombre: 'Dra. María', apellido: 'González' },
  servicio: { nombre: 'Control general' },
} as unknown as Turno

describe('cleanPhone', () => {
  it('devuelve string vacío si no hay teléfono', () => {
    expect(cleanPhone(undefined)).toBe('')
    expect(cleanPhone('')).toBe('')
  })

  it('normaliza un número de 10 dígitos al formato 549…', () => {
    expect(cleanPhone('1140483693')).toBe('5491140483693')
  })

  it('quita el 0 inicial y normaliza', () => {
    expect(cleanPhone('011 4048-3693')).toBe('5491140483693')
  })

  it('respeta un número que ya viene con prefijo 54', () => {
    expect(cleanPhone('5491140483693')).toBe('5491140483693')
  })
})

describe('formatWhatsAppMessage', () => {
  it('usa el mensaje predeterminado con los datos del turno', () => {
    const msg = formatWhatsAppMessage(baseTurno)
    expect(msg).toContain('Juan Pérez')
    expect(msg).toContain('Control general')
    expect(msg).toContain('Dra. María González')
    expect(msg).toContain('20 de julio')
    expect(msg).toContain('10:00 hs')
  })

  it('reemplaza las variables de un template personalizado', () => {
    const msg = formatWhatsAppMessage(baseTurno, 'Hola {nombre}, te esperamos el {fecha} a las {hora_inicio}.')
    expect(msg).toContain('Hola Juan, te esperamos el')
    expect(msg).toContain('20 de julio')
    expect(msg).toContain('a las 10:00')
    // No deben quedar placeholders sin reemplazar
    expect(msg).not.toContain('{nombre}')
    expect(msg).not.toContain('{fecha}')
  })
})

describe('getInitialEmailText', () => {
  it('devuelve el texto por defecto cuando no hay template', () => {
    expect(getInitialEmailText(baseTurno, '')).toBe(
      'Te recordamos que tenés un turno programado. A continuación, los detalles:',
    )
  })

  it('reemplaza variables cuando hay template', () => {
    const text = getInitialEmailText(baseTurno, 'Turno con {profesional} para {servicio}.')
    expect(text).toBe('Turno con Dra. María González para Control general.')
  })
})
