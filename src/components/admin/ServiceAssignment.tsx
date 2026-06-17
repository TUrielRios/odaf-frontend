"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Badge } from "../ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { 
  Briefcase, 
  Plus, 
  X, 
  AlertCircle, 
  Search, 
  Check, 
  Clock, 
  DollarSign,
  Layers
} from 'lucide-react'
import { adminApi } from "../../api/admin"
import type { Profesional, Servicio } from "../../types"
import { useToast } from "../../hooks/use-toast"
import { cn } from "../../lib/utils"

interface ServiceAssignmentProps {
  professional: Profesional
  onServicesUpdate?: (servicios: Servicio[]) => void
}

export const ServiceAssignment: React.FC<ServiceAssignmentProps> = ({ professional, onServicesUpdate }) => {
  const { toast } = useToast()
  const [assignedServices, setAssignedServices] = useState<Servicio[]>([])
  const [availableServices, setAvailableServices] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [professional.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [servicesResponse, allServicesResponse] = await Promise.all([
        adminApi.profesionales.obtenerServicios(professional.id),
        adminApi.servicios.listar({ estado: "Activo" }),
      ])

      setAssignedServices(servicesResponse.servicios)

      const assignedIds = servicesResponse.servicios.map(s => s.id)
      const available = allServicesResponse.data.filter(s => !assignedIds.includes(s.id))
      setAvailableServices(available)
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddServices = async () => {
    if (selectedServiceIds.length === 0) return

    try {
      setSaving(true)
      const response = await adminApi.profesionales.asignarServicios(professional.id, {
        servicio_ids: selectedServiceIds,
      })

      setAssignedServices(response.servicios)
      onServicesUpdate?.(response.servicios)

      const assignedIds = response.servicios.map(s => s.id)
      const available = availableServices.filter(s => !assignedIds.includes(s.id))
      setAvailableServices(available)

      setSelectedServiceIds([])
      setShowAddModal(false)
      
      toast({
        title: "Servicios asignados",
        description: "Los servicios se han vinculado correctamente al profesional.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error assigning services:", error)
      toast({
        title: "Error",
        description: "No se pudieron asignar los servicios. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveService = async (servicioId: number) => {
    if (!confirm("¿Estás seguro de que quieres remover este servicio?")) return

    try {
      await adminApi.profesionales.removerServicio(professional.id, servicioId)

      const removedService = assignedServices.find(s => s.id === servicioId)
      const newAssigned = assignedServices.filter(s => s.id !== servicioId)

      setAssignedServices(newAssigned)
      if (removedService) {
        setAvailableServices(prev => [...prev, removedService].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }

      onServicesUpdate?.(newAssigned)
      
      toast({
        title: "Servicio removido",
        description: "El servicio ha sido desvinculado del profesional.",
      })
    } catch (error) {
      console.error("Error removing service:", error)
      toast({
        title: "Error",
        description: "No se pudo remover el servicio. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const toggleServiceSelection = (servicioId: number) => {
    setSelectedServiceIds(prev =>
      prev.includes(servicioId)
        ? prev.filter(id => id !== servicioId)
        : [...prev, servicioId]
    )
  }

  const filteredAvailableServices = useMemo(() => {
    return availableServices.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableServices, searchTerm])

  const groupedServices = useMemo(() => {
    const groups: Record<string, Servicio[]> = {}
    filteredAvailableServices.forEach(s => {
      if (!groups[s.categoria]) groups[s.categoria] = []
      groups[s.categoria].push(s)
    })
    return groups
  }, [filteredAvailableServices])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
          <div className="h-10 bg-muted animate-pulse rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl border border-border"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-primary" />
            Servicios Asignados
          </h3>
          <p className="text-sm text-muted-foreground">
            Servicios que {professional.nombre} {professional.apellido} está capacitado para realizar
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)} 
          className="shadow-sm hover:shadow-md transition-all duration-200"
          disabled={availableServices.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Asignar Nuevos
        </Button>
      </div>

      {assignedServices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">Sin servicios asignados</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            Este profesional aún no tiene servicios asociados. Asigna al menos uno para que pueda recibir turnos.
          </p>
          <Button variant="outline" onClick={() => setShowAddModal(true)} disabled={availableServices.length === 0}>
            Comenzar a asignar
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedServices.map((servicio) => (
            <div
              key={servicio.id}
              className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                  {servicio.categoria}
                </Badge>
                <button
                  onClick={() => handleRemoveService(servicio.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-destructive/10"
                  title="Remover servicio"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <h4 className="font-bold text-foreground mb-3 line-clamp-1">{servicio.nombre}</h4>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {servicio.duracion_estimada} min
                </div>
                <div className="flex items-center text-xs font-semibold text-primary">
                  <DollarSign className="h-3 w-3" />
                  {Number(servicio.precio_base).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false)
          setSelectedServiceIds([])
          setSearchTerm("")
        } else {
          setShowAddModal(true)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Asignar Servicios</DialogTitle>
            <DialogDescription>
              Busca y selecciona los servicios que deseas habilitar para este profesional.
            </DialogDescription>
            
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
                 placeholder="Buscar por nombre o categoría..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 h-11 bg-muted/40 border-muted"
               />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {Object.keys(groupedServices).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-muted-foreground opacity-40" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchTerm ? "No se encontraron servicios con ese nombre" : "No hay más servicios disponibles"}
                </p>
              </div>
            ) : (
              Object.entries(groupedServices).map(([categoria, servicios]) => (
                <div key={categoria} className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    <Layers className="h-3 w-3 mr-2" />
                    {categoria}
                    <span className="ml-2 h-[1px] flex-1 bg-border/50"></span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servicios.map((servicio) => {
                      const isSelected = selectedServiceIds.includes(servicio.id)
                      return (
                        <div
                          key={servicio.id}
                          onClick={() => toggleServiceSelection(servicio.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200",
                            isSelected 
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-background border-border hover:border-primary/50 hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary text-white" : "border-input bg-background"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {servicio.nombre}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-muted-foreground flex items-center">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                {servicio.duracion_estimada}'
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground">
                                ${Number(servicio.precio_base).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="p-6 pt-2 border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setSelectedServiceIds([])
                setSearchTerm("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddServices}
              disabled={selectedServiceIds.length === 0 || saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Asignando...
                </div>
              ) : (
                `Asignar ${selectedServiceIds.length} seleccionado(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
