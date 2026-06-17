import React, { useState } from 'react'
import { dentalColors } from '../../config/colors'
import {
  Calendar,
  Users,
  Briefcase,
  Settings,
  LogOut,
  X,
  Home,
  UserCog,
  FileText,
  Wallet,
  DollarSign,
  CalendarOff,
  Shield,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Menu
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
  userRole: string
  permisosTabs?: string[] | null
  onLogout: () => void
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  userRole,
  permisosTabs,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, adminOnly: false },
    { id: 'calendar', label: 'Calendario', icon: Calendar, adminOnly: false },
    { id: 'patients', label: 'Pacientes', icon: UserCog, adminOnly: false },
    { id: 'professionals', label: 'Profesionales', icon: Users, adminOnly: false },
    { id: 'services', label: 'Servicios', icon: Briefcase, adminOnly: false },
    { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign, adminOnly: true },
    { id: 'debtors', label: 'Reporte de deudores', icon: FileText, adminOnly: true },
    { id: 'cashflow', label: 'Flujo de caja', icon: Wallet, adminOnly: true },
    { id: 'feriados', label: 'Feriados', icon: Calendar, adminOnly: false },
    { id: 'ausencias', label: 'Ausencias/Vacaciones', icon: CalendarOff, adminOnly: false },
    { id: 'obras-sociales', label: 'Obras Sociales', icon: Shield, adminOnly: false },
    { id: 'procedimientos', label: 'Procedimientos', icon: FileText, adminOnly: false },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell, adminOnly: false },

    { id: 'settings', label: 'Configuración', icon: Settings, adminOnly: false },
  ]

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false
    if (userRole === 'admin') return true
    if (permisosTabs && permisosTabs.length > 0) return permisosTabs.includes(item.id)
    return !item.adminOnly
  })

  const handleLogout = () => {
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-[45]">
        <div className="flex items-center gap-3">
          <img
            src="/assets/odaf-logo.png"
            alt="ODAF"
            className="h-8 w-auto"
          />
          <span className="text-lg font-black text-[#026498] tracking-tight">Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72 lg:static lg:inset-0 flex flex-col`}>

        {/* Header del sidebar */}
        <div className={`flex items-center justify-between h-16 border-b border-[${dentalColors.gray200}] ${isCollapsed ? 'lg:px-4' : 'px-6'}`}>
          <div className="flex items-center overflow-hidden">
            <img
              src="/assets/odaf-logo.png"
              alt="ODAF"
              className={`h-8 w-auto transition-all ${isCollapsed ? 'lg:opacity-0 lg:scale-0 lg:w-0' : 'opacity-100 scale-100'}`}
            />
            {isCollapsed && (
               <img
               src="/assets/odaf-logo.png"
               alt="ODAF"
               className="h-8 w-8 object-contain hidden lg:block"
             />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id)
                    setSidebarOpen(false)
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-bold capitalize tracking-tight rounded-xl transition-all duration-200 group ${isActive
                    ? `bg-[#026498] text-white shadow-md`
                    : `text-gray-500 hover:bg-gray-100 hover:text-gray-900`
                    } ${isCollapsed ? 'lg:justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'} ${isCollapsed ? 'lg:mr-0' : 'mr-3'}`} />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-bold capitalize tracking-tight text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group ${isCollapsed ? 'lg:justify-center' : ''}`}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'lg:mr-0' : 'mr-3'}`} />
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-6 no-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
