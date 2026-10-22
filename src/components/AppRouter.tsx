import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { dentalColors } from '../config/colors'

// Import components and apps
import { LandingPage } from './landing/LandingPage'
import { LegalPage } from './landing/LegalPage'
import { BookingForm } from './booking/BookingForm'
import { AdminApp } from './admin/AdminApp'
import { PatientApp } from './patient-portal/PatientApp'

const BookingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: dentalColors.gray50 }}>
      <main className="flex-1 py-8">
        {/* Formulario de reserva */}
        <BookingForm />
      </main>
    </div>
  )
}

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BookingLayout />} />
      <Route path="/inicio" element={<LandingPage />} />
      <Route path="/turnos" element={<BookingLayout />} />
      <Route path="/politica-de-privacidad" element={<LegalPage type="privacy" />} />
      <Route path="/terminos-de-uso" element={<LegalPage type="terms" />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/paciente/*" element={<PatientApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
