"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "../ui/Button"
import { Card, CardContent } from "../ui/Card"
import { Badge } from "../ui/badge"
import { Pagination } from "../ui/Pagination"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { liquidacionesApi } from "../../api/liquidaciones"
import { prestacionesApi } from "../../api/prestaciones"
import type { Liquidacion } from "../../types"
import { Spinner } from "../ui/spinner"
import { useToast } from "../../hooks/use-toast"
import { NuevaLiquidacionModal } from "./liquidaciones/NuevaLiquidacionModal"
import { LiquidacionDetailModal } from "./liquidaciones/LiquidacionDetailModal"
import { ComisionManager } from "./ComisionManager"

function RecalcularMontos({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRecalcular = async () => {
    if (!confirm("Esto va a recalcular los montos de TODAS las prestaciones pendientes que estén en $0. ¿Continuar?")) return
    try {
      setLoading(true)
      const result = await prestacionesApi.recalcular()
      const partes = []
      if (result.actualizadas > 0) partes.push(`${result.actualizadas} con precio corregido`)
      if ((result as any).comision_corregida > 0) partes.push(`${(result as any).comision_corregida} con comisión aplicada`)
      if (result.sin_precio_configurado > 0) partes.push(`${result.sin_precio_configurado} sin precio (ajuste manual)`)
      toast({
        title: "Recalculación completada",
        description: partes.length > 0 ? partes.join(" · ") : "No había prestaciones para corregir.",
      })
      onDone()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo recalcular" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 border border-yellow-200 bg-yellow-50 rounded-lg p-4">
      <h3 className="font-medium text-yellow-800 mb-1">Prestaciones con monto $0</h3>
      <p className="text-sm text-yellow-700 mb-3">
        Si hay prestaciones con importe $0, este botón intenta recalcularlas usando los precios del plan de tratamiento
        o del servicio configurado. Las que vengan de <strong>turnos</strong> necesitan que el servicio tenga un precio
        cargado en la sección Servicios.
      </p>
      <Button variant="outline" onClick={handleRecalcular} disabled={loading}>
        {loading ? "Recalculando..." : "Recalcular prestaciones con $0"}
      </Button>
    </div>
  )
}

export function LiquidacionesManager() {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedLiquidacion, setSelectedLiquidacion] = useState<Liquidacion | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const liquidacionesRes = await liquidacionesApi.listar({ limit: 200 })
      setLiquidaciones(liquidacionesRes.data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las liquidaciones",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLiquidacionClick = async (id: number) => {
    try {
      // Fetch full details including prestaciones
      const fullLiquidacion = await liquidacionesApi.obtener(id)
      setSelectedLiquidacion(fullLiquidacion)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el detalle de la liquidación",
      })
    }
  }

  const handleAnular = async (id: number) => {
    if (!confirm("¿Está seguro de que desea anular esta liquidación? Esta acción no se puede deshacer.")) return

    try {
      await liquidacionesApi.anular(id, "Anulada manualmente por el administrador")
      toast({ title: "Éxito", description: "Liquidación anulada correctamente" })
      setSelectedLiquidacion(null)
      cargarDatos()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo anular la liquidación" })
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Está seguro de que desea ELIMINAR esta liquidación? Se borrará permanentemente.")) return

    try {
      await liquidacionesApi.eliminar(id)
      toast({ title: "Éxito", description: "Liquidación eliminada correctamente" })
      setSelectedLiquidacion(null)
      cargarDatos()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la liquidación" })
    }
  }

  const handlePagar = async (id: number) => {
    const metodo = prompt("Método de pago (ej: Transferencia, Efectivo, Cheque):")
    if (!metodo) return

    const fecha = new Date().toISOString().split("T")[0]
    try {
      await liquidacionesApi.pagar(id, { fecha_pago: fecha, metodo_pago: metodo })
      toast({ title: "Éxito", description: "Pago registrado correctamente" })
      setSelectedLiquidacion(null)
      cargarDatos()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo registrar el pago" })
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    return `${s.toLocaleDateString('es-AR', options)} - ${e.toLocaleDateString('es-AR', options)}`
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(amount))
  }

  const { paginatedLiquidaciones, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedLiquidaciones: liquidaciones.slice(startIndex, endIndex),
      totalPages: Math.ceil(liquidaciones.length / itemsPerPage)
    };
  }, [liquidaciones, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="listado">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <TabsList>
            <TabsTrigger value="listado">Liquidaciones</TabsTrigger>
            <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
          </TabsList>
          <TabsContent value="listado" className="mt-0">
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="uppercase text-xs tracking-wider font-medium"
            >
              Nueva Liquidación
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="listado">
          <Card>
            <CardContent className="p-0">
              {liquidaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay liquidaciones registradas
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {paginatedLiquidaciones.map((liquidacion) => (
                      <div
                        key={liquidacion.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center group"
                        onClick={() => handleLiquidacionClick(liquidacion.id)}
                      >
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-light">
                            Período: {formatDateRange(liquidacion.periodo_inicio, liquidacion.periodo_fin)}
                          </p>
                          <h3 className="text-lg font-normal text-gray-800 uppercase tracking-wide">
                            {liquidacion.profesional?.apellido} {liquidacion.profesional?.nombre}
                          </h3>
                        </div>

                        <div className="flex items-center gap-6">
                          {liquidacion.estado !== "Generada" && (
                            <Badge variant={liquidacion.estado === "Pagada" ? "outline" : "secondary"} className="font-normal">
                              {liquidacion.estado}
                            </Badge>
                          )}

                          <span className="text-xl font-normal text-gray-900">
                            {formatCurrency(liquidacion.monto_profesional)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={liquidaciones.length}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comisiones">
          <ComisionManager />
          <RecalcularMontos onDone={cargarDatos} />
        </TabsContent>
      </Tabs>

      <NuevaLiquidacionModal
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={cargarDatos}
      />

      <LiquidacionDetailModal
        open={!!selectedLiquidacion}
        onOpenChange={(open) => !open && setSelectedLiquidacion(null)}
        liquidacion={selectedLiquidacion}
        onAnular={handleAnular}
        onEliminar={handleEliminar}
        onPagar={handlePagar}
        onUpdate={cargarDatos}
        onDownload={(id) => console.log("Download", id)}
      />
    </div>
  )
}
