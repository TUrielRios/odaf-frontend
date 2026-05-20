import React, { useState, useEffect } from 'react'
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
import { authApi } from '../../api/auth'
import { apiClient } from '../../lib/api-client'
import type { AuthUser } from '../../types'

const AdminLogin: React.FC<{ onLogin: (user: AuthUser) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authApi.login({ email, password })
      onLogin(response.user)
    } catch (err: any) {
      setError(err?.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8">
        <div className="text-center mb-8">
          <img src="/assets/odaf-logo.png" alt="ODAF" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#026498] tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Ingrese sus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#026498] focus:border-transparent outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#026498] text-white rounded-xl font-bold text-sm hover:bg-[#0c4a6e] transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const AdminApp: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.me()
        setUser(userData)
      } catch {
        setUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = (userData: AuthUser) => {
    setUser(userData)
  }

  const handleLogout = () => {
    authApi.logout()
    setUser(null)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/assets/odaf-logo.png" alt="ODAF" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={handleLogin} />
  }

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
        return user.role === 'admin' ? <LiquidacionesManager /> : null
      case 'debtors':
        return user.role === 'admin' ? <DebtorsReport /> : null
      case 'cashflow':
        return user.role === 'admin' ? <CashFlow /> : null
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
    <AdminLayout
      currentView={currentView}
      onViewChange={(view) => {
        setCurrentView(view)
        if (view !== 'patients') setSelectedPatientId(null)
      }}
      userRole={user.role || 'profesional'}
      onLogout={handleLogout}
    >
      {renderCurrentView()}
    </AdminLayout>
  )
}
