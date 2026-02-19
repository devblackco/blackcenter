import React from 'react';
import { UploadCloud, Clock, QrCode, AlertTriangle, Search, FileSpreadsheet } from 'lucide-react';
import { ExportBatch } from '../types';

const mockBatches: ExportBatch[] = [
  { id: '#2481-TNY', date: '24/10/2023 - 14:30', status: 'Confirmado', itemsCount: 450 },
  { id: '#2480-TNY', date: '23/10/2023 - 09:15', status: 'Gerado', itemsCount: 320 },
  { id: '#2479-TNY', date: '22/10/2023 - 18:45', status: 'Erro Validação', itemsCount: 12 },
  { id: '#2478-TNY', date: '20/10/2023 - 10:00', status: 'Confirmado', itemsCount: 458 },
];

const ExportacoesTiny = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Exportações Tiny</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie o envio de produtos para o ERP e visualize o histórico de processamento.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-95">
          <UploadCloud className="w-4 h-4 mr-2" />
          Gerar Planilha Tiny
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
              Concluído
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Último Batch</p>
            <h3 className="text-2xl font-bold text-slate-900">#2481-TNY</h3>
            <p className="text-xs text-slate-400 mt-1">Processado hoje às 14:30</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total SKUs Exportados</p>
            <h3 className="text-2xl font-bold text-slate-900">1.240</h3>
            <p className="text-xs text-slate-400 mt-1">Acumulado do mês atual</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-red-200 hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500 opacity-80"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Divergências</p>
            <h3 className="text-2xl font-bold text-slate-900">3</h3>
            <p className="text-xs text-slate-400 mt-1">Produtos com erro de validação</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Lotes</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2 text-slate-400 w-4 h-4" />
            <input className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white text-sm transition-all" placeholder="Buscar batch..." type="text" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data / Hora</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKUs</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {mockBatches.map((batch) => (
                <tr key={batch.id} className={`hover:bg-slate-50 transition-colors group ${batch.status === 'Erro Validação' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900">{batch.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-500">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      {batch.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${batch.status === 'Confirmado' ? 'bg-green-50 text-green-700 border-green-200' :
                        batch.status === 'Gerado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${batch.status === 'Confirmado' ? 'bg-green-500' :
                          batch.status === 'Gerado' ? 'bg-blue-500' : 'bg-red-500'
                        }`}></span>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-slate-900">{batch.itemsCount}</span>
                      <span className="text-xs text-slate-400 ml-1">itens</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className={batch.status === 'Erro Validação' ? 'text-red-600 hover:text-red-800' : 'text-primary hover:text-primary-hover'}>
                      {batch.status === 'Erro Validação' ? 'Ver Erros' : 'Detalhes'}
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

export default ExportacoesTiny;