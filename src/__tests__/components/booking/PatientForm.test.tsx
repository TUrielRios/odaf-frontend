import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { PatientForm } from '@/components/booking/PatientForm'

vi.mock('@/api', () => ({
  obrasSocialesApi: {
    listar: vi.fn().mockResolvedValue([])
  },
  copagosApi: {
    obtener: vi.fn().mockResolvedValue({ monto: 5000 })
  }
}))

describe('PatientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<PatientForm onPatientData={() => {}} />)
    
    expect(screen.getByText('Tus Datos')).toBeInTheDocument()
    expect(screen.getByText('Información Personal')).toBeInTheDocument()
  })

  it('should show validation errors when submitting empty form', async () => {
    render(<PatientForm onPatientData={() => {}} />)
    
    const submitButton = screen.getByRole('button', { name: /Confirmar Cita/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    })
  })

  it('should render submit button', () => {
    render(<PatientForm onPatientData={() => {}} />)
    
    expect(screen.getByRole('button', { name: /Confirmar Cita/i })).toBeInTheDocument()
  })
})
