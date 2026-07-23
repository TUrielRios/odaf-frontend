import { describe, it, expect } from 'vitest'
import { formatFecha, formatFechaHora, hoyLocal } from '@/lib/fechas'

describe('hoyLocal', () => {
  it('devuelve la fecha de hoy como YYYY-MM-DD', () => {
    expect(hoyLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatFecha', () => {
  it('devuelve "-" para valores vacíos', () => {
    expect(formatFecha(null)).toBe('-')
    expect(formatFecha(undefined)).toBe('-')
  })

  it('no corre la fecha por zona horaria (DATEONLY)', () => {
    // El día debe ser el 20, no el 19 (bug de UTC-3).
    const out = formatFecha('2026-07-20', { day: 'numeric', month: 'numeric', year: 'numeric' })
    expect(out).toContain('20')
    expect(out).toContain('7')
    expect(out).toContain('2026')
  })
})

describe('formatFechaHora', () => {
  it('devuelve "-" para valores vacíos o inválidos', () => {
    expect(formatFechaHora(null)).toBe('-')
    expect(formatFechaHora(undefined)).toBe('-')
    expect(formatFechaHora('no-es-fecha')).toBe('-')
  })

  it('formatea un timestamp ISO en hora argentina (UTC-3)', () => {
    // 14:30 UTC -> 11:30 en Argentina.
    const out = formatFechaHora('2026-07-20T14:30:00.000Z')
    expect(out).toContain('20/07/2026')
    expect(out).toContain('11:30')
  })

  it('convierte correctamente cruzando el cambio de día', () => {
    // 01:00 UTC del 21 -> 22:00 del 20 en Argentina.
    const out = formatFechaHora('2026-07-21T01:00:00.000Z')
    expect(out).toContain('20/07/2026')
    expect(out).toContain('22:00')
  })
})
