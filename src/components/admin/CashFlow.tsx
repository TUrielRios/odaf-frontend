import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/Button";
import { Pagination } from "../ui/Pagination";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cuentaCorrienteApi } from '../../api/cuenta-corriente';
import { Plus, Minus } from 'lucide-react';
import { NewMovementModal } from './cashflow/NewMovementModal';

const formatMovementDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const cleanDate = dateString.split('T')[0];
        const [year, month, day] = cleanDate.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return format(date, "d MMM. yyyy", { locale: es });
    } catch (e) {
        return dateString;
    }
};

export default function CashFlow() {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Ingreso' | 'Egreso'>('Ingreso');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await cuentaCorrienteApi.getFlujoCaja();
            setMovimientos(data.movimientos);
            setBalance(data.balance);
        } catch (error) {
            console.error("Error fetching cash flow:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (type: 'Ingreso' | 'Egreso') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleMovementRegistered = () => {
        fetchData();
        setIsModalOpen(false);
    };

    const { paginatedMovimientos, totalPages } = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            paginatedMovimientos: movimientos.slice(startIndex, endIndex),
            totalPages: Math.ceil(movimientos.length / itemsPerPage)
        };
    }, [movimientos, currentPage, itemsPerPage]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Flujo de Caja</h2>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleOpenModal('Ingreso')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Ingreso
                    </Button>
                    <Button
                        onClick={() => handleOpenModal('Egreso')}
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                        <Minus className="w-4 h-4 mr-2" />
                        Registrar Extracción o Deuda
                    </Button>
                </div>
            </div>

            {/* Filters (Mockup for now) */}
            <div className="flex gap-2 items-center text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                <span>Estas viendo:</span>
                <Badge variant="secondary">Periodo: Todos</Badge>
                <Badge variant="secondary">Forma de pago: Todas</Badge>
                <Badge variant="secondary">Tipo: Todos</Badge>
            </div>

            {/* Balance Card */}
            <Card className="w-fit min-w-[300px]">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-500">Balance ARS</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-400">Según filtro</span>
                            <span className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(balance)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Movements List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Cargando...</div>
                    ) : movimientos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay movimientos registrados.</div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 border-b pb-2">
                                    <div className="col-span-2">FECHA</div>
                                    <div className="col-span-6">DESCRIPCIÓN</div>
                                    <div className="col-span-2">FORMA DE PAGO</div>
                                    <div className="col-span-2 text-right">IMPORTE</div>
                                </div>

                                {/* Rows */}
                                {paginatedMovimientos.map((m) => (
                                    <div key={m.id} className="grid grid-cols-12 gap-4 text-sm items-center py-2 border-b last:border-0 hover:bg-gray-50">
                                        <div className="col-span-2 text-gray-600">
                                            {formatMovementDate(m.fecha)}
                                        </div>
                                        <div className="col-span-6">
                                            <div className="font-medium text-gray-900">
                                                {m.pacienteNombre ? m.pacienteNombre.toUpperCase() : (m.descripcion || 'Movimiento General')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {m.obraSocial ? `${m.obraSocial} | ` : ''}
                                                {m.tipo.toUpperCase()}
                                                {m.descripcion && m.pacienteNombre ? ` | ${m.descripcion}` : ''}
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-gray-600">
                                            {m.forma_pago || '-'}
                                        </div>
                                        <div className={`col-span-2 text-right font-medium ${m.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(m.monto)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={movimientos.length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {isModalOpen && (
                <NewMovementModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleMovementRegistered}
                    type={modalType}
                />
            )}
        </div>
    );
}
