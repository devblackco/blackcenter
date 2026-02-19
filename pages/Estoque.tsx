import React from 'react';
import { RefreshCw, Search, Filter, Edit, Package, AlertTriangle, XCircle, History, ArrowLeftRight } from 'lucide-react';

const mockInventory = [
    { sku: 'BC-2024-88', name: 'Headset Gamer Pro X - Preto', onHand: 4, reserved: 2, available: 2, min: 10, status: 'Abaixo do Mínimo' },
    { sku: 'BC-2024-01', name: 'Camiseta Básica Preta - M', onHand: 50, reserved: 5, available: 45, min: 10, status: 'Normal' },
    { sku: 'BC-2024-42', name: 'Mouse Sem Fio Ergonomico', onHand: 12, reserved: 0, available: 12, min: 5, status: 'Normal' },
    { sku: 'BC-2024-91', name: 'Cabo HDMI 2.0 - 2m', onHand: 0, reserved: 0, available: 0, min: 20, status: 'Zerado' },
    { sku: 'BC-2024-11', name: 'Teclado Mecânico RGB', onHand: 156, reserved: 24, available: 132, min: 30, status: 'Normal' },
];

const Estoque = () => {
    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate">Estoque</h2>
                    <p className="mt-1 text-sm text-slate-500">Gerencie saldos, reservas e status operacional dos produtos.</p>
                    <p className="mt-2 text-xs text-slate-400 flex items-center">
                        <History className="w-3 h-3 mr-1" />
                        Última exportação Tiny: Hoje às 08:30
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Movimentar Estoque
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 p-4 flex items-center shadow-sm">
                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                        <Package className="text-primary w-6 h-6" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-slate-500 truncate">Total SKUs</dt>
                            <dd className="text-xl font-semibold text-slate-900">1,420</dd>
                        </dl>
                    </div>
                </div>
                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 p-4 flex items-center shadow-sm">
                    <div className="flex-shrink-0 bg-orange-100 p-3 rounded-lg">
                        <AlertTriangle className="text-orange-600 w-6 h-6" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-slate-500 truncate">Abaixo do Mínimo</dt>
                            <dd className="text-xl font-semibold text-slate-900">24</dd>
                        </dl>
                    </div>
                </div>
                <div className="bg-white overflow-hidden rounded-xl border border-slate-200 p-4 flex items-center shadow-sm">
                    <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
                        <XCircle className="text-red-600 w-6 h-6" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-slate-500 truncate">Zerados</dt>
                            <dd className="text-xl font-semibold text-slate-900">12</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="text-slate-400 w-5 h-5" />
                        </div>
                        <input className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2.5 bg-white" placeholder="Buscar por SKU ou Nome" type="text" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <select className="block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-white">
                                <option>Todos Status</option>
                                <option>Normal</option>
                                <option>Abaixo do Mínimo</option>
                                <option>Zerado</option>
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <button className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50">
                                <Filter className="w-4 h-4 mr-2" />
                                Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">SKU</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">On-hand (Tiny)</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Reservado Interno</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponível Operacional</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Estoque Mínimo</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="relative px-6 py-4"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {mockInventory.map((item) => (
                                <tr key={item.sku} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-700">{item.name}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{item.onHand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{item.reserved}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${item.available < item.min ? 'text-orange-600' : (item.available === 0 ? 'text-red-600' : 'text-slate-900')}`}>{item.available}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{item.min}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Abaixo do Mínimo' ? 'bg-orange-100 text-orange-800' :
                                                item.status === 'Zerado' ? 'bg-red-100 text-red-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'Abaixo do Mínimo' ? 'bg-orange-600' :
                                                    item.status === 'Zerado' ? 'bg-red-600' :
                                                        'bg-green-600'
                                                }`}></span>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-primary hover:text-primary-hover opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Estoque;