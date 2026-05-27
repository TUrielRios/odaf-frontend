"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Save, User, Check } from "lucide-react"
import { authApi, type UsuarioAdmin } from "../../api/auth"

const TABS_DISPONIBLES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calendar", label: "Calendario" },
  { id: "patients", label: "Pacientes" },
  { id: "professionals", label: "Profesionales" },
  { id: "services", label: "Servicios" },
  { id: "feriados", label: "Feriados" },
  { id: "ausencias", label: "Ausencias/Vacaciones" },
  { id: "obras-sociales", label: "Obras Sociales" },
  { id: "procedimientos", label: "Procedimientos" },
  { id: "recordatorios", label: "Recordatorios" },
  { id: "settings", label: "Configuración" },
]

export const PermisosTabsManager: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UsuarioAdmin | null>(null)
  const [selectedTabs, setSelectedTabs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const data = await authApi.listarUsuarios()
      setUsuarios(data.filter((u) => u.role === "profesional"))
    } catch (error) {
      console.error("Error fetching usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (usuario: UsuarioAdmin) => {
    setSelectedUser(usuario)
    setSelectedTabs(usuario.permisos_tabs || TABS_DISPONIBLES.map((t) => t.id))
    setSuccessMsg("")
  }

  const handleToggleTab = (tabId: string) => {
    setSelectedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((t) => t !== tabId) : [...prev, tabId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTabs(TABS_DISPONIBLES.map((t) => t.id))
  }

  const handleDeselectAll = () => {
    setSelectedTabs([])
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    setSuccessMsg("")
    try {
      const permisos = selectedTabs.length === TABS_DISPONIBLES.length ? null : selectedTabs
      await authApi.actualizarPermisosTabs(selectedUser.id, permisos)
      setSuccessMsg("Permisos guardados correctamente")
      fetchUsuarios()
    } catch (error) {
      console.error("Error saving permisos:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Permisos de Pestañas</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configura qué secciones puede ver cada profesional en su panel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de profesionales */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Profesionales
          </h4>
          <div className="space-y-1">
            {usuarios.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No hay usuarios profesionales
              </p>
            ) : (
              usuarios.map((usuario) => (
                <button
                  key={usuario.id}
                  onClick={() => handleSelectUser(usuario)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedUser?.id === usuario.id
                      ? "bg-[#026498] text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{usuario.nombre}</p>
                    <p className={`text-xs truncate ${selectedUser?.id === usuario.id ? "text-blue-100" : "text-gray-500"}`}>
                      {usuario.email}
                    </p>
                  </div>
                  {usuario.permisos_tabs && (
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                      selectedUser?.id === usuario.id ? "bg-blue-400/30 text-white" : "bg-orange-100 text-orange-700"
                    }`}>
                      {usuario.permisos_tabs.length}/{TABS_DISPONIBLES.length}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Configuración de tabs */}
        <Card className="p-4 lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedUser.nombre}
                  </h4>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Ninguna
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TABS_DISPONIBLES.map((tab) => (
                  <label
                    key={tab.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedTabs.includes(tab.id)
                        ? "border-[#026498] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedTabs.includes(tab.id)
                          ? "border-[#026498] bg-[#026498]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedTabs.includes(tab.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTabs.includes(tab.id)}
                      onChange={() => handleToggleTab(tab.id)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700">{tab.label}</span>
                  </label>
                ))}
              </div>

              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 font-medium">
                  {successMsg}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Permisos"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona un profesional para configurar sus permisos</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
