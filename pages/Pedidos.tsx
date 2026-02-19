import React from 'react';
import { RefreshCw, Search, ArrowDown, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { Order } from '../types';

const mockOrders: Order[] = [
  { id: '#10234', tinyId: '998877', date: '12/10/2023 14:30', statusReserva: 'Separando', origin: 'Tiny ERP', itemsCount: 5, timeInQueue: '2h 15m' },
  { id: '#10235', tinyId: '998878', date: '12/10/2023 15:15', statusReserva: 'Reservado', origin: 'Tiny ERP', itemsCount: 2, timeInQueue: '45m' },
  { id: '#10231', tinyId: '998870', date: '11/10/2023 09:00', statusReserva: 'Atrasado', origin: 'Tiny ERP', itemsCount: 12, timeInQueue: '26h 30m' },
  { id: '#10236', tinyId: '998880', date: '12/10/2023 16:45', statusReserva: 'Pendente', origin: 'Tiny ERP', itemsCount: 1, timeInQueue: '10m' },
  { id: '#10237', tinyId: '998882', date: '12/10/2023 17:00', statusReserva: 'Reservado', origin: 'Tiny ERP', itemsCount: 3, timeInQueue: '5m' },
];

const Pedidos = () => {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Pedidos</h1>
          <div className="flex flex-col sm:flex-row sm:items-center mt-1 gap-2 sm:gap-4">
            <p className="text-sm text-slate-500">Fluxo operacional e controle de reservas internas.</p>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
            <p className="text-xs font-medium text-emerald-600 flex items-center">
              <RefreshCw className="w-3 h-3 mr-1" />
              Última sincronização Tiny: Hoje às 17:30
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
            { label: 'Pendentes', value: 42, bgClass: 'bg-blue-100', textClass: 'text-blue-600', icon: 'pending' },
            { label: 'Em Separação', value: 15, bgClass: 'bg-amber-100', textClass: 'text-amber-600', icon: 'inventory' },
            { label: 'Atrasados', value: 3, bgClass: 'bg-red-100', textClass: 'text-red-600', icon: 'warning' }
        ].map((card) => (
            <div key={card.label} className="bg-white px-4 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={`${card.bgClass} p-3 rounded-lg shrink-0`}>
                    <span className={`material-icons ${card.textClass} text-xl`}>{card.icon}</span>
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
            </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-500 bg-white" placeholder="Buscar Pedido, SKU ou Cliente..." type="text"/>
                </div>
                <div className="relative w-full sm:w-48">
                    <select className="block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary text-slate-600 bg-white">
                        <option value="">Status: Todos</option>
                        <option value="novo">Novo</option>
                        <option value="pago">Pago</option>
                    </select>
                </div>
                <div className="relative w-full sm:w-48">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary placeholder-slate-500 bg-white" placeholder="Data" type="text"/>
                </div>
            </div>
            <button className="flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-1">Nº Pedido <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Reserva</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Origem</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Nº Itens</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempo em Fila</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${order.statusReserva === 'Atrasado' ? 'bg-red-50/50 border-l-4 border-l-red-500' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">{order.id}</div>
                    <div className="text-xs text-slate-500">Tiny ID: {order.tinyId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-700">{order.date.split(' ')[0]}</div>
                    <div className="text-xs text-slate-500">{order.date.split(' ')[1]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                        order.statusReserva === 'Separando' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        order.statusReserva === 'Reservado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        order.statusReserva === 'Atrasado' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            order.statusReserva === 'Separando' ? 'bg-amber-500' :
                            order.statusReserva === 'Reservado' ? 'bg-emerald-500' :
                            order.statusReserva === 'Atrasado' ? 'bg-red-500' :
                            'bg-slate-500'
                        }`}></span>
                        {order.statusReserva}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{order.origin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{order.itemsCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {order.statusReserva === 'Atrasado' && <AlertTriangle className="w-3 h-3 inline mr-1 text-red-500" />}
                    <span className={order.statusReserva === 'Atrasado' ? 'text-red-600 font-medium' : ''}>{order.timeInQueue}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:text-blue-800 font-medium inline-flex items-center p-2 rounded-lg hover:bg-primary/5">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
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

export default Pedidos;