import React from 'react';
import { ShoppingBasket, Wallet, AlertCircle, Info, Search, Printer, CheckCircle, Truck, Clock } from 'lucide-react';
import { ExpedicaoItem } from '../types';

const mockData: ExpedicaoItem[] = [
  {
    id: '#10235',
    pedNumber: 'PED-29931',
    items: [{
      name: '2x Camiseta Básica Preta (M)',
      sku: 'CMB-PT-M',
      qty: 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0rGFL4xI3c8BT-iL30OwTfC1aWyCIh8P5dFr5OzxqgdnSWa3DaR1E9SKsoqgFhndxX5U0i_QYlJE4EkBACPV2J5cb3697iUzsPBmIu0xSlBm6PJyPx9Lx34az7Fj3OrtFDbdclRxlm2F2h1WyCxr1CLENwlZlrt2wTXaZsT7V77GluWpIDqnfg5Nd3fywhbDqOWjXIOSYb8pgI3gIw1NUSL4QB0myXByLT1_Prij7NjsmV1Bs-DNL9YLdNzDQSQIHffN-_LCQWksx'
    }],
    local: 'A-12',
    time: '2h 15m',
    status: 'Separando',
    isLate: true
  },
  {
    id: '#10236',
    pedNumber: 'PED-1102',
    items: [{
      name: '1x Tênis Esportivo Vermelho (42)',
      sku: 'TN-VM-42',
      qty: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnSQ11s7JHJtHMwZhAXoUC7LkfldcyXtW2absnDdyAxi291od6EGL2plE--99NlVD90iwYDZIlgOooO_qrSDyi0V8ERDiCX0nirqpcI9QcRbbpZNEyZcUKOTmhVuEK13SOvK8ZZ_VDRXwPYP5SfOvf8r9K69ETgQw-I7vTm0GoyqlkSceZveakdHfSSJr_jgXymio1ZS77q81ellV6wLogRdEwhucNs2xv9z6J2jNoxSlfJGm1af6X1w228ubP5KyneJOgDJ6gl4tJ'
    }],
    local: 'B-04',
    time: '15m',
    status: 'Pago'
  },
  {
    id: '#10237',
    pedNumber: 'PED-29940',
    items: [{
      name: '1x Jaqueta Jeans Vintage (G)',
      sku: 'JJ-VT-G',
      qty: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvDid5pKGXzTm8R0vi5ouF74uDeAwihoKsJXo97AyQ05wwUeDAUIzGsLHuJQNtYl27ZIL-RbUa-PgLDy2eTd90wmMFPdwlV9_QfX4MOskWgCZ1hyJdYywglHFF_VJmd7K2InOwgcaHOP5ZksE5BexAUfTK_EwU0R-Vu1_mxLL9VoKNVo_j2q3jFWzyOUakhahwoHhy8PKD5wfAh7cV8kQJNEK0HuutGWt5KfeFsuR6X0dHRE01e_h6_7U43wIIOZ1jhfRx_ceeKdrT'
    }],
    local: 'C-10',
    time: '22m',
    status: 'Pago'
  },
  {
    id: '#10231',
    pedNumber: 'PED-9912',
    items: [{
      name: '5x Kit Meias Esportivas',
      sku: 'ME-KIT-05',
      qty: 5,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCazie2KMbVJ9-aRF80Sb6_jHbaP0WTuEs20i3m8IVtfu8YEtwLILRWFhLDOYhhzkxh48yi3aFNK5BSNVY-zkCrwzhmoEukRCv0Nj_lEt5sYQR4g27_EOjyrra4i07A0VjwX8TSzVHaW1BnY5Vah7y0Nf7kw0b7K_9VzWEST7XL2ub3d-sI_fu4J7VkSHMEvoTU37yWN1-wl5HsqTQyQbdy9ZOrkOdhGwaDb21yUUj-JWpAzYzj5aaImWXFEF9aQrUS8U3ALTM9Q88J'
    }],
    local: 'A-02',
    time: '4h 05m',
    status: 'Separando',
    isLate: true
  },
  {
    id: '#10239',
    pedNumber: 'DIR-002',
    items: [{
      name: '1x Camisa Flanela Xadrez (P)',
      sku: 'CF-XD-P',
      qty: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5zD3My40zaTW1s6Priid4f3ygpoYJNdV62GxDajKQzcp8zyg9KSABmr1sl-j5oKcTSaXc-i0LSpWnzXaLCyDrNxjOAqUcXjBHYkLHrx-sdMpDbStRlYOb-KFwGF3gne1-mTkqOKgKQpu6MC5HtDwGDgj4kI72HyNQZZiLMoEKgeKItbhrXl-21nmRX1cgsS7UAetWKkQ88uOwHtIZO9bbKn9T1nooUMg8Jc__8Q6H4nlLb7jW93or-B0GTPaf8gAlOz-6lXtgRrTQ'
    }],
    local: 'D-05',
    time: '5m',
    status: 'Pago'
  }
];

const Expedicao = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Expedição</h1>
        <p className="mt-1 text-sm text-slate-500">Controle de separação, envio e acompanhamento de pedidos.</p>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
            <ShoppingBasket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">A Separar</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pagos (Aguardando)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">5</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Atrasos / Pendências</p>
            <p className="text-2xl font-bold text-red-600 mt-1">3</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto w-full sm:w-auto">
          <button className="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-all whitespace-nowrap">
            Todos (17)
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-md bg-white text-primary shadow-sm transition-all whitespace-nowrap border border-slate-200">
            A Separar / Pagos
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-all whitespace-nowrap">
            Enviados
          </button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hidden sm:flex">
            <Info className="w-4 h-4" />
            ERP Integrado
          </div>
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary placeholder-slate-400 font-medium"
              placeholder="Buscar pedido, SKU ou Cliente"
              type="text"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium whitespace-nowrap">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Etiquetas</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[35%]">Itens</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Local</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockData.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors group ${item.isLate ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-primary">{item.id}</span>
                      <span className="text-xs font-mono text-slate-400">{item.pedNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden">
                        <img className="w-full h-full object-cover" src={item.items[0].image} alt="Product" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">{item.items[0].name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.items[0].sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg border border-slate-200">{item.local}</span>
                  </td>
                  <td className="px-6 py-4">
                    {item.isLate ? (
                      <div className="flex items-center gap-1.5 text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-sm w-fit">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-medium px-2 py-1 rounded text-sm w-fit">
                        {item.time.includes('h') ? <AlertCircle className="w-3.5 h-3.5 text-orange-500" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={item.time.includes('h') ? 'text-orange-600' : 'text-slate-600'}>{item.time}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'Separando' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'Separando' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-all">
                        <CheckCircle className="w-4 h-4" />
                        Separado
                      </button>
                      <button className="flex items-center gap-1.5 bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed">
                        <Truck className="w-4 h-4" />
                        Enviado
                      </button>
                    </div>
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

export default Expedicao;