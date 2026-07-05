import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../ui/dialog"
import { Button } from "../../ui/Button"
import { Label } from "../../ui/label"
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group"
import { Select } from "../../ui/Select"

import { liquidacionesApi } from "../../../api/liquidaciones"
import { profesionalesApi } from "../../../api/profesionales"
import { obrasSocialesApi } from "../../../api/obras-sociales"
import type { Profesional, ObraSocial } from "../../../types"
import { useToast } from "../../../hooks/use-toast"
import { Spinner } from "../../ui/spinner"

interface NuevaLiquidacionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function NuevaLiquidacionModal({
    open,
    onOpenChange,
    onSuccess,
}: NuevaLiquidacionModalProps) {
    const [step, setStep] = useState<"form" | "preview">("form")
    const [profesionales, setProfesionales] = useState<Profesional[]>([])
    const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
    const [loading, setLoading] = useState(false)
    const [simulating, setSimulating] = useState(false)
    const { toast } = useToast()

    // Form State
    const [selectedProfesional, setSelectedProfesional] = useState<string>("")
    const [periodo, setPeriodo] = useState<string>("mes")
    const [tipo, setTipo] = useState<string>("obra_social")
    const [selectedObraSocial, setSelectedObraSocial] = useState<string>("")
    const [fechaCustomInicio, setFechaCustomInicio] = useState<string>("")
    const [fechaCustomFin, setFechaCustomFin] = useState<string>("")
    const [observaciones, setObservaciones] = useState<string>("")

    // Simulation Result
    const [simulationResult, setSimulationResult] = useState<any>(null)

    useEffect(() => {
        if (open) {
            cargarDatos()
            setStep("form")
            setSimulationResult(null)
            setSelectedProfesional("")
            setPeriodo("mes")
            setTipo("obra_social")
            setSelectedObraSocial("")
            setFechaCustomInicio("")
            setFechaCustomFin("")
            setObservaciones("")
        }
    }, [open])

    const cargarDatos = async () => {
        try {
            const [profesionalesRes, obrasSocialesRes] = await Promise.all([
                profesionalesApi.listar({ estado: "Activo" }),
                obrasSocialesApi.getAll(),
            ])
            setProfesionales(profesionalesRes.data)
            setObrasSociales(obrasSocialesRes)
        } catch (error) {
            console.error("Error al cargar datos:", error)
        }
    }

    const handleSimular = async () => {
        if (!selectedProfesional) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debe seleccionar un profesional",
            })
            return
        }

        if (tipo === "obra_social" && !selectedObraSocial) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debe seleccionar una obra social",
            })
            return
        }

        if (periodo === "custom" && (!fechaCustomInicio || !fechaCustomFin)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debe seleccionar fecha de inicio y fin",
            })
            return
        }

        try {
            setSimulating(true)
            const result = await liquidacionesApi.simular({
                profesional_id: Number(selectedProfesional),
                periodo,
                tipo,
                obra_social_id: selectedObraSocial ? Number(selectedObraSocial) : undefined,
                fecha_custom_inicio: periodo === "custom" ? fechaCustomInicio : undefined,
                fecha_custom_fin: periodo === "custom" ? fechaCustomFin : undefined,
            })

            // We allow 0 results to be shown in preview, so the user can see there is nothing to settle
            // if (result.cantidad_prestaciones === 0) {
            //     toast({
            //         title: "Información",
            //         description: "No se encontraron prestaciones para liquidar con los filtros seleccionados.",
            //     })
            //     // return // Removed return to allow showing the preview state
            // }

            setSimulationResult(result)
            setObservaciones(`Liquidación generada automáticamente. Tipo: ${tipo === 'obra_social' ? 'Obra Social' : tipo === 'pago_recibido' ? 'Pago Recibido' : 'Tratamiento'}. Periodo: ${periodo}`)
            setStep("preview")
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error al simular liquidación",
            })
        } finally {
            setSimulating(false)
        }
    }

    const handleConfirmar = async () => {
        try {
            console.log("Confirming liquidation...")
            console.log("Simulation Result:", simulationResult)

            const payload = {
                profesional_id: Number(selectedProfesional),
                periodo_inicio: simulationResult.periodo_inicio.split('T')[0],
                periodo_fin: simulationResult.periodo_fin.split('T')[0],
                observaciones: observaciones,
                monto_custom: Number(simulationResult.monto_profesional)
            }

            console.log("Payload to send:", payload)

            setLoading(true)
            await liquidacionesApi.crear(payload)

            toast({
                title: "Éxito",
                description: "Liquidación generada correctamente",
            })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error generating liquidation:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error al generar liquidación",
            })
        } finally {
            setLoading(false)
        }
    }

    const getProfesionalName = () => {
        const prof = profesionales.find(p => p.id.toString() === selectedProfesional)
        return prof ? `${prof.nombre} ${prof.apellido}` : ""
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-normal">
                        {step === "form" ? "Nueva Liquidación" : "Confirmar Liquidación"}
                    </DialogTitle>
                </DialogHeader>

                {step === "form" ? (
                    <div className="py-6 space-y-8">
                        {/* Profesional Selector */}
                        <div className="space-y-2">
                            <Label>Profesional *</Label>
                            <Select
                                value={selectedProfesional}
                                onChange={(e) => setSelectedProfesional(e.target.value)}
                                options={[
                                    { value: "", label: "Seleccione un profesional" },
                                    ...profesionales.map(p => ({
                                        value: p.id.toString(),
                                        label: `${p.nombre} ${p.apellido}`
                                    }))
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Periodo Column */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Período</Label>
                                <RadioGroup value={periodo} onValueChange={setPeriodo} className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="hoy" id="hoy" />
                                        <Label htmlFor="hoy" className="font-normal cursor-pointer">Hoy</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="semana" id="semana" />
                                        <Label htmlFor="semana" className="font-normal cursor-pointer">Última semana</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="mes" id="mes" />
                                        <Label htmlFor="mes" className="font-normal cursor-pointer">Lo que va del mes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <Label htmlFor="custom" className="font-normal cursor-pointer">Rango personalizado</Label>
                                    </div>
                                </RadioGroup>

                                {periodo === "custom" && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <Label className="text-xs text-gray-500 mb-1 block">Desde</Label>
                                            <input
                                                type="date"
                                                className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={fechaCustomInicio}
                                                onChange={(e) => setFechaCustomInicio(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500 mb-1 block">Hasta</Label>
                                            <input
                                                type="date"
                                                className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={fechaCustomFin}
                                                onChange={(e) => setFechaCustomFin(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tipo Column */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Tipo</Label>
                                <RadioGroup value={tipo} onValueChange={setTipo} className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="pago_recibido" id="pago_recibido" />
                                        <Label htmlFor="pago_recibido" className="font-normal cursor-pointer">Pago recibido</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="tratamiento" id="tratamiento" />
                                        <Label htmlFor="tratamiento" className="font-normal cursor-pointer">Tratamiento en progreso (valor total)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="obra_social" id="obra_social" />
                                        <Label htmlFor="obra_social" className="font-normal cursor-pointer">Obra social</Label>
                                    </div>
                                </RadioGroup>

                                {/* Obra Social Dropdown - Conditional */}
                                {tipo === "obra_social" && (
                                    <div className="mt-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-sm text-gray-500 mb-1.5 block">Obra Soc *</Label>
                                        <Select
                                            value={selectedObraSocial}
                                            onChange={(e) => setSelectedObraSocial(e.target.value)}
                                            options={[
                                                { value: "", label: "Seleccione obra social" },
                                                ...obrasSociales.map(os => ({
                                                    value: os.id.toString(),
                                                    label: os.nombre
                                                }))
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-md">
                            <h4 className="font-medium text-orange-800 mb-1">
                                {tipo === "obra_social" ? "Obra social" : tipo === "pago_recibido" ? "Pago recibido" : "Tratamiento en progreso"}
                            </h4>
                            <p className="text-sm text-orange-700">
                                {tipo === "obra_social"
                                    ? "Vas a liquidar tratamientos autorizados en progreso o completados de pacientes que tengan obra social."
                                    : tipo === "pago_recibido"
                                        ? "Vas a liquidar pagos que ya han sido recibidos de los pacientes."
                                        : "Vas a liquidar el valor total de tratamientos que están actualmente en curso."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        {/* Encabezado */}
                        <div className="bg-gray-50 border rounded-md p-4 space-y-1 text-sm">
                            <p><span className="text-gray-500">Profesional:</span> <strong>{getProfesionalName()}</strong></p>
                            <p><span className="text-gray-500">Período:</span> {new Date(simulationResult.periodo_inicio).toLocaleDateString('es-AR')} — {new Date(simulationResult.periodo_fin).toLocaleDateString('es-AR')}</p>
                            <p><span className="text-gray-500">Prestaciones:</span> <strong>{simulationResult.cantidad_prestaciones}</strong></p>
                        </div>

                        {/* Desglose de montos */}
                        <div className="border rounded-md overflow-hidden">
                            {/* Total generado */}
                            <div className="flex justify-between items-center px-4 py-3 bg-white">
                                <span className="text-sm text-gray-600">Total generado por los servicios</span>
                                <span className="text-base font-semibold text-gray-800">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(simulationResult.monto_total_servicios))}
                                </span>
                            </div>

                            {/* Porcentaje — multiplicación sobre el total */}
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t">
                                <span className="text-sm text-gray-500">
                                    × {simulationResult.porcentaje_profesional ?? '—'}% (comisión del profesional)
                                </span>
                                <span className="text-sm text-gray-400">
                                    queda en clínica: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
                                        Number(simulationResult.monto_total_servicios) - Number(simulationResult.monto_profesional)
                                    )}
                                </span>
                            </div>

                            {/* Monto profesional — editable */}
                            <div className="px-4 py-3 bg-green-50 border-t border-green-200">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-semibold text-green-800">
                                        Le corresponde al profesional
                                        {Number(simulationResult.monto_profesional) === 0 && (
                                            <span className="ml-2 text-yellow-600 font-normal">(ingresá manualmente)</span>
                                        )}
                                    </Label>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xl font-bold text-green-700">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="text-xl font-bold text-green-700 bg-white border-2 border-green-400 rounded-md px-3 py-1 focus:outline-none focus:border-green-600 w-44 text-right"
                                            value={simulationResult.monto_profesional}
                                            onChange={(e) => setSimulationResult({ ...simulationResult, monto_profesional: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-green-700 mt-1">Podés editar este valor si necesitás ajustarlo.</p>
                            </div>
                        </div>

                        {Number(simulationResult.monto_profesional) === 0 && (
                            <div className="bg-yellow-50 border border-yellow-400 rounded-md p-3">
                                <p className="text-sm font-semibold text-yellow-800">⚠️ El monto calculado es $0</p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Los servicios probablemente no tienen precio configurado. Ingresá el monto correcto arriba antes de confirmar.
                                </p>
                            </div>
                        )}

                        {/* Observaciones */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones</Label>
                            <textarea
                                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px]"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Descripción del trabajo..."
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="flex justify-between items-center border-t pt-4">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        CANCELAR
                    </Button>
                    <div className="flex gap-2">
                        {step === "preview" && (
                            <Button variant="outline" onClick={() => setStep("form")}>
                                VOLVER
                            </Button>
                        )}
                        <Button
                            onClick={step === "form" ? handleSimular : handleConfirmar}
                            disabled={simulating || loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {simulating ? <Spinner className="w-4 h-4 mr-2" /> : null}
                            {step === "form" ? "SIMULAR" : "CONFIRMAR"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
