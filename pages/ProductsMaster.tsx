import React from 'react';
import { CheckCircle, Package, LayoutGrid, Search, Filter, Workflow, Layers, PlusCircle, Box, Edit, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ProductsMaster = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total SKUs Ativos</span>
            <CheckCircle className="text-primary w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-slate-900">1.248</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12 este mês
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Modelos (Simples)</span>
            <Package className="text-blue-500 w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-slate-900">842</div>
          <div className="mt-2 text-xs text-slate-500">Unidades base cadastradas</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Kits Virtuais</span>
            <LayoutGrid className="text-amber-500 w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-slate-900">156</div>
          <div className="mt-2 text-xs text-slate-500">Agrupamentos lógicos</div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input className="pl-10 pr-4 py-2 w-full rounded-lg border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-400 shadow-sm transition-shadow" placeholder="Buscar por SKU, Modelo ou Nome..." type="text" />
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border-slate-200 bg-white text-sm text-slate-600 py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm cursor-pointer">
              <option value="">Tipo: Todos</option>
              <option value="PAI">PAI</option>
              <option value="SIMPLES">SIMPLES</option>
              <option value="VARIAÇÃO">VARIAÇÃO</option>
              <option value="KIT">KIT</option>
            </select>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary transition-colors shadow-sm">
              <Filter className="w-5 h-5 block" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button onClick={() => navigate('/produtos/novo-pai')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
            <Workflow className="w-5 h-5 text-slate-400" />
            Novo Produto Pai
          </button>
          <button onClick={() => navigate('/produtos/nova-variacao')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
            <Layers className="w-5 h-5 text-slate-400" />
            Nova Variação
          </button>
          <button onClick={() => navigate('/kits/novo')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
            <PlusCircle className="w-5 h-5 text-slate-400" />
            Novo Kit
          </button>
          <Link
            to="/produtos/novo"
            className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
          >
            <Box className="w-5 h-5" />
            Novo Produto Simples
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">ID Modelo</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU Base / Pai</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Nome do Produto</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Marca / Categoria</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Status</th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded select-all tracking-tight">PAI-1020</span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">PAI</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-600">1020</td>
                <td className="py-3 px-4 text-sm text-slate-400 italic">-</td>
                <td className="py-3 px-4">
                  <div className="text-sm font-bold text-slate-900">Camisa Polo Tech</div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">Marca Alpha / Vestuário</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded select-all tracking-tight">SMP-3342</span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">SIMPLES</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-600">3342</td>
                <td className="py-3 px-4 text-sm text-slate-400 italic">-</td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-slate-900">Mochila Urban X1</div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">Marca Beta / Acessórios</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4 pl-8 border-l-2 border-slate-200">
                  <Link to="/produto-detalhe">
                    <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded select-all tracking-tight hover:text-primary hover:border-primary">VAR-1020-P-PR</span>
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">VARIAÇÃO</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-600">1020</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Pai:</span>
                    <span className="text-xs font-mono font-medium text-slate-700">PAI-1020</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-slate-900">Camisa Polo Tech - Preta (P)</div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">Marca Alpha / Vestuário</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link to="/produto-detalhe">
                    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded select-all tracking-tight">KIT-VRT-99</span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">KIT</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-600">9900</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Base:</span>
                    <span className="text-xs font-mono font-medium text-slate-700">VAR-1020-P-PR (+2)</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-slate-900">Combo Verão 3 Peças</div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">Multimarcas / Promocional</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Rascunho
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">4</span> de <span className="font-medium">1.248</span> registros mestres
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="z-10 bg-primary/10 border-primary text-primary relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</button>
                <button className="bg-white border-slate-300 text-slate-500 hover:bg-slate-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">2</button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-slate-400">
        © 2024 BlackCenter ERP - Repositório Mestre de SKUs. Todos os IDs são imutáveis.
      </div>
    </div>
  );
};

export default ProductsMaster;