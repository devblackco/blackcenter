import React from 'react';
import { Info, Plus, Search, RefreshCw, Filter, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Kit } from '../types';

const mockKits: Kit[] = [
    { sku: 'KIT-GM-001', name: 'Kit Gamer Iniciante - RGB', componentsText: 'Mouse + Teclado + Headset', stockCalc: 45, numComponents: 3, status: 'Ativo' },
    { sku: 'KIT-OFF-023', name: 'Kit Office Home Essencial', componentsText: 'Monitor 24" + Suporte Articulado', stockCalc: 2, numComponents: 2, status: 'Baixo Est.', stockWarning: true },
    { sku: 'KIT-VER-005', name: 'Kit Verão Premium', componentsText: 'Boné + Óculos + Toalha', stockCalc: 0, numComponents: 3, status: 'Pausado', stockWarning: true },
    { sku: 'KIT-BB-012', name: 'Kit Bebê Conforto', componentsText: 'Cadeirinha + Protetor Solar', stockCalc: 120, numComponents: 2, status: 'Ativo' },
    { sku: 'KIT-COZ-088', name: 'Kit Cozinha Masterchef', componentsText: 'Conjunto Panelas + Faqueiro', stockCalc: 18, numComponents: 2, status: 'Ativo' },
    { sku: 'KIT-ESCOLAR-1A', name: 'Kit Escolar Fundamental 1', componentsText: 'Mochila + Estojo + Cadernos', stockCalc: 5, numComponents: 5, status: 'Baixo Est.', stockWarning: true },
    { sku: 'KIT-FER-202', name: 'Kit Ferramentas Básico', componentsText: 'Martelo + Alicate + Chaves', stockCalc: 64, numComponents: 3, status: 'Ativo' },
];

const Kits = () => {
    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">Kits</h1>
                    <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        Última exportação: 12/05/2024 14:30 - <span className="text-emerald-600 font-medium">Sucesso</span>
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-primary-hover transition-colors">
                    <Plus className="w-4 h-4" />
                    Novo Kit
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Kits</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">142</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kits Críticos</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">8</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="flex-shrink-0 bg-emerald-100 p-3 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ativos</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">124</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 placeholder-slate-400" placeholder="Buscar por SKU ou Nome do kit..." type="text" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Status: Todos
                        </button>
                        <button className="p-2 text-slate-500 hover:text-primary transition-colors bg-white border border-slate-200 rounded-lg" title="Atualizar dados">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">SKU do Kit</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Estoque Calc.</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Nº Componentes</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {mockKits.map((kit) => (
                                <tr key={kit.sku} className={`hover:bg-slate-50 transition-colors group ${kit.status === 'Baixo Est.' ? 'bg-orange-50/40' :
                                        kit.status === 'Pausado' ? 'bg-red-50/40' : ''
                                    }`}>
                                    <td className="px-6 py-4 text-sm font-medium text-primary font-mono">{kit.sku}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">{kit.name}</span>
                                            <span className="text-xs text-slate-500">{kit.componentsText}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${kit.stockWarning ? (kit.stockCalc === 0 ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700') : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {kit.stockCalc} un
                                            </span>
                                            {kit.stockWarning && (
                                                kit.stockCalc === 0 ? <AlertTriangle className="text-red-500 w-4 h-4" /> : <AlertTriangle className="text-orange-500 w-4 h-4 animate-pulse" />
                                            )}
                                        </div>
                                        {kit.stockWarning && (
                                            <span className={`text-[10px] mt-1 block font-medium ${kit.stockCalc === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                {kit.stockCalc === 0 ? 'Boné esgotado' : 'Estojo < 10'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center text-slate-600">{kit.numComponents}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${kit.status === 'Ativo' ? 'border-green-200 text-green-700 bg-green-50' :
                                                kit.status === 'Baixo Est.' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                                                    'border-slate-200 text-slate-600 bg-slate-50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${kit.status === 'Ativo' ? 'bg-green-500' :
                                                    kit.status === 'Baixo Est.' ? 'bg-orange-500' :
                                                        'bg-slate-400'
                                                }`}></span>
                                            {kit.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-sm font-medium text-primary hover:text-primary-hover">Editar</button>
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

export default Kits;