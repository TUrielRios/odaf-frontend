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
                    <div className="py-6 space-y-6">
                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <p><strong>Profesional:</strong> {getProfesionalName()}</p>
                            <p><strong>Período:</strong> {new Date(simulationResult.periodo_inicio).toLocaleDateString()} - {new Date(simulationResult.periodo_fin).toLocaleDateString()}</p>
                            <p><strong>Cantidad de prestaciones:</strong> {simulationResult.cantidad_prestaciones}</p>

                            <div className="pt-2 border-t mt-2">
                                <Label className="text-sm font-medium text-gray-700">Total a liquidar</Label>
                                <div className="flex items-center mt-1">
                                    <span className="text-lg font-bold text-green-600 mr-2">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="text-lg font-bold text-green-600 bg-transparent border-b border-green-300 focus:outline-none focus:border-green-600 w-32"
                                        value={simulationResult.monto_profesional}
                                        onChange={(e) => setSimulationResult({ ...simulationResult, monto_profesional: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Puede modificar este monto si es necesario.</p>
                            </div>

                            <div className="pt-2 mt-2">
                                <Label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones / Descripción del trabajo</Label>
                                <textarea
                                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Ingrese detalles sobre la liquidación..."
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            Revise los datos antes de confirmar. Se generará una liquidación oficial y las prestaciones se marcarán como liquidadas.
                        </p>
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
