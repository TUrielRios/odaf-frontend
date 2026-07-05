import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/Button"
import { Label } from "../../ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table"
import { Trash2, Download, CheckCircle, Ban, Pencil } from "lucide-react"
import type { Liquidacion } from "../../../types"
import { liquidacionesApi } from "../../../api/liquidaciones"
import { useToast } from "../../../hooks/use-toast"
import { formatFecha } from "../../../lib/fechas"

interface LiquidacionDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    liquidacion: Liquidacion | null
    onAnular?: (id: number) => void
    onEliminar?: (id: number) => void
    onPagar?: (id: number) => void
    onDownload?: (id: number) => void
    onUpdate?: () => void
    /** @deprecated use onAnular */
    onDelete?: (id: number) => void
}

export function LiquidacionDetailModal({
    open,
    onOpenChange,
    liquidacion,
    onAnular,
    onEliminar,
    onPagar,
    onDownload,
    onUpdate,
    onDelete,
}: LiquidacionDetailModalProps) {
    const { toast } = useToast()
    const [isEditing, setIsEditing] = useState(false)
    const [editMonto, setEditMonto] = useState("")
    const [editObservaciones, setEditObservaciones] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (liquidacion) {
            setEditMonto(liquidacion.monto_profesional?.toString() ?? "")
            setEditObservaciones(liquidacion.observaciones ?? "")
            setIsEditing(false)
        }
    }, [liquidacion])

    if (!liquidacion) return null

    // formatFecha evita el corrimiento de un día de las fechas DATEONLY ("YYYY-MM-DD")
    const formatDate = (dateString: string) => formatFecha(dateString)

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(amount))
    }

    const handleGuardar = async () => {
        try {
            setSaving(true)
            await liquidacionesApi.actualizar(liquidacion.id, {
                monto_profesional: Number(editMonto),
                observaciones: editObservaciones,
            } as any)
            toast({ title: "Éxito", description: "Liquidación actualizada correctamente" })
            setIsEditing(false)
            onUpdate?.()
            onOpenChange(false)
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* flex flex-col + overflow-hidden para que el footer quede fijo abajo */}
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-white">
                <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-normal">Liquidación</DialogTitle>
                </DialogHeader>

                {/* Área scrollable */}
                <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
                    {/* Header Info */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-1">
                            <p className="font-medium">
                                Miembro: <span className="font-normal uppercase">{liquidacion.profesional?.nombre} {liquidacion.profesional?.apellido}</span>
                            </p>
                            <p className="font-medium">
                                Período: <span className="font-normal">{formatDate(liquidacion.periodo_inicio)} - {formatDate(liquidacion.periodo_fin)}</span>
                            </p>
                            <p className="font-medium">
                                Estado: <span className="font-normal">{liquidacion.estado}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-sm text-gray-500">
                                Forma de pago: {liquidacion.metodo_pago || "Pendiente"}
                            </div>
                            {onDownload && (
                                <Button variant="outline" size="sm" onClick={() => onDownload(liquidacion.id)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    DESCARGAR
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Formulario de edición */}
                    {isEditing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                            <h4 className="font-medium text-blue-800">Editar liquidación</h4>
                            <div>
                                <Label className="text-sm text-gray-700">Monto al profesional ($)</Label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 w-48 px-3 py-2 text-lg font-bold border-2 border-blue-400 rounded-md focus:outline-none focus:border-blue-600"
                                    value={editMonto}
                                    onChange={(e) => setEditMonto(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-sm text-gray-700">Observaciones</Label>
                                <textarea
                                    className="mt-1 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    value={editObservaciones}
                                    onChange={(e) => setEditObservaciones(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Observaciones (modo lectura) */}
                    {!isEditing && liquidacion.observaciones && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm border">
                            <span className="font-medium block mb-1">Observaciones / Descripción:</span>
                            {liquidacion.observaciones}
                        </div>
                    )}

                    {/* Tabla */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Detalle de la liquidación</h3>
                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Trabajo</TableHead>
                                        <TableHead className="text-right">Importe ARS ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {liquidacion.prestaciones?.map((prestacion: any) => (
                                        <TableRow key={prestacion.id}>
                                            <TableCell>{formatDate(prestacion.fecha)}</TableCell>
                                            <TableCell>
                                                {prestacion.paciente?.obraSocial ? "Obra social" : "Particular"}
                                            </TableCell>
                                            <TableCell className="uppercase">
                                                {prestacion.paciente?.apellido} {prestacion.paciente?.nombre}
                                            </TableCell>
                                            <TableCell>
                                                {prestacion.servicio?.nombre || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(prestacion.monto_total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!liquidacion.prestaciones || liquidacion.prestaciones.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                                No hay detalles disponibles
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Desglose de comisión al pie */}
                        <div className="mt-3 border rounded-md overflow-hidden text-sm">
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                                <span className="text-gray-600">Total generado por los servicios</span>
                                <span className="font-semibold text-gray-800">
                                    {formatCurrency(liquidacion.monto_total_servicios ?? 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t text-gray-500">
                                <span>
                                    × {(() => {
                                        const pct = liquidacion.profesional?.porcentaje_comision
                                        if (pct != null) return pct
                                        const total = Number(liquidacion.monto_total_servicios)
                                        const prof = Number(liquidacion.monto_profesional)
                                        if (total > 0) return Math.round((prof / total) * 100)
                                        return "—"
                                    })()}% (comisión del profesional)
                                </span>
                                <span>
                                    queda en clínica: {formatCurrency(
                                        Number(liquidacion.monto_total_servicios ?? 0) - Number(liquidacion.monto_profesional ?? 0)
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-green-50 border-t border-green-200">
                                <span className="font-semibold text-green-800">Le corresponde al profesional</span>
                                <span className="text-lg font-bold text-green-700">
                                    {formatCurrency(liquidacion.monto_profesional ?? 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer fijo — no scrollea */}
                <div className="flex-shrink-0 border-t pt-4 flex flex-wrap gap-2 justify-between items-center">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                                CANCELAR
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleGuardar}
                                disabled={saving}
                            >
                                {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Botones izquierda: acciones destructivas */}
                            <div className="flex flex-wrap gap-2">
                                {liquidacion.estado === "Generada" && (
                                    <Button
                                        variant="outline"
                                        className="border-blue-400 text-blue-600 hover:bg-blue-50"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        EDITAR
                                    </Button>
                                )}
                                {(onAnular ?? onDelete) && liquidacion.estado !== "Anulada" && liquidacion.estado !== "Pagada" && (
                                    <Button
                                        variant="outline"
                                        className="border-orange-400 text-orange-600 hover:bg-orange-50"
                                        onClick={() => (onAnular ?? onDelete)!(liquidacion.id)}
                                    >
                                        <Ban className="w-4 h-4 mr-2" />
                                        ANULAR
                                    </Button>
                                )}
                                {onEliminar && liquidacion.estado !== "Pagada" && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => onEliminar(liquidacion.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        ELIMINAR
                                    </Button>
                                )}
                            </div>

                            {/* Botones derecha: cerrar + pagar */}
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    CERRAR
                                </Button>
                                {onPagar && liquidacion.estado === "Generada" && (
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => onPagar(liquidacion.id)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        REGISTRAR PAGO
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
