import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/label";
import { Select } from "../../ui/Select";
import { cuentaCorrienteApi } from '../../../api/cuenta-corriente';
import { Bold, Italic, Strikethrough, Link, List, ListOrdered, AlignLeft, AlignCenter, Undo, Redo } from 'lucide-react';

interface NewMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'Ingreso' | 'Egreso';
}

const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function NewMovementModal({ isOpen, onClose, onSuccess, type }: NewMovementModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        monto: '',
        forma_pago: 'Efectivo',
        descripcion: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await cuentaCorrienteApi.registrarCaja({
                fecha: formData.fecha,
                tipo: type, // 'Ingreso' or 'Egreso'
                monto: parseFloat(formData.monto),
                forma_pago: formData.forma_pago,
                descripcion: formData.descripcion
            });
            onSuccess();
        } catch (error) {
            console.error("Error registering movement:", error);
        } finally {
            setLoading(false);
        }
    };

    const paymentOptions = [
        { value: 'Efectivo', label: 'Efectivo' },
        { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' },
        { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito' },
        { value: 'Transferencia', label: 'Transferencia' }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-normal text-gray-700">
                        {type === 'Ingreso' ? 'Ingreso' : 'Egreso'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Date */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fecha" className="text-right font-bold text-gray-700">
                            {/* Icon or Label */}
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="fecha"
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                className="w-[200px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Select
                                    label="Forma de pago"
                                    value={formData.forma_pago}
                                    onChange={(e) => setFormData({ ...formData, forma_pago: e.target.value })}
                                    options={paymentOptions}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-gray-800">Monto</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
                                    <Input
                                        type="number"
                                        placeholder="Importe ..."
                                        className="pl-8 bg-gray-50 border-gray-200"
                                        value={formData.monto}
                                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Description with Toolbar) */}
                        <div className="space-y-2">
                            <Label className="font-bold text-gray-800">Información Adicional</Label>

                            {/* Toolbar Mockup */}
                            <div className="flex items-center gap-1 border border-b-0 border-gray-300 rounded-t-md p-1 bg-white">
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Strikethrough className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Link className="h-4 w-4" /></Button>
                                <div className="w-px h-4 bg-gray-300 mx-1" />
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><AlignLeft className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><AlignCenter className="h-4 w-4" /></Button>
                                <div className="w-px h-4 bg-gray-300 mx-1" />
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><List className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><ListOrdered className="h-4 w-4" /></Button>
                                <div className="flex-1" />
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Undo className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Redo className="h-4 w-4" /></Button>
                            </div>

                            <textarea
                                className="w-full min-h-[150px] p-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-gray-100 hover:bg-gray-200 text-gray-900 min-w-[100px]">
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
