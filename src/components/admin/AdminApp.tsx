import React, { useState } from 'react'
import { AdminLayout } from './AdminLayout'
import { Dashboard } from './Dashboard'
import { CalendarView } from './CalendarView'
import { ProfessionalsManager } from './ProfessionalsManager'
import { ServicesManager } from './ServicesManager'
import { PatientsView } from '../patients/PatientsView'
import { ObrasSocialesManager } from './ObrasSocialesManager'
import { RemindersView } from './RemindersView'

import { LiquidacionesManager } from './LiquidacionesManager'
import DebtorsReport from './DebtorsReport'
import CashFlow from './CashFlow'
import { FeriadosManager } from './FeriadosManager'
import { AusenciasManager } from './AusenciasManager'

export const AdminApp: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const handleNavigateToPatient = (id: string) => {
    setSelectedPatientId(id)
    setCurrentView('patients')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigateToCalendar={() => setCurrentView('calendar')} />
      case 'calendar':
        return <CalendarView onNavigateToPatient={handleNavigateToPatient} />
      case 'patients':
        return <PatientsView initialPatientId={selectedPatientId} onClearPatient={() => setSelectedPatientId(null)} />
      case 'professionals':
        return <ProfessionalsManager />
      case 'services':
        return <ServicesManager />
      case 'liquidaciones':
        return <LiquidacionesManager />
      case 'debtors':
        return <DebtorsReport />
      case 'cashflow':
        return <CashFlow />
      case 'feriados':
        return <FeriadosManager />
      case 'ausencias':
        return <AusenciasManager />
      case 'obras-sociales':
        return <ObrasSocialesManager />
      case 'recordatorios':
        return <RemindersView />
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración</h3>
            <p className="text-gray-600">Panel de configuración en desarrollo</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <AdminLayout currentView={currentView} onViewChange={(view) => {
      setCurrentView(view)
      if (view !== 'patients') setSelectedPatientId(null)
    }}>
      {renderCurrentView()}
    </AdminLayout>
  )
}