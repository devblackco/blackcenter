import React from 'react';
import { ChevronRight, History, Save, Info, Lock, Maximize2, ExternalLink, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductDetail = () => {
  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/produtos" className="hover:text-primary">Produtos</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">Tênis Performance Ultra V2</span>
          </nav>
          <h1 className="text-xl font-bold flex items-center gap-3 text-slate-900">
            Tênis Performance Ultra V2
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">TIPO: SIMPLES</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-all">
            <History className="w-4 h-4" />
            Histórico
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="flex items-center gap-8 border-b border-slate-200">
          <button className="pb-3 text-sm font-semibold text-primary border-b-2 border-primary relative">
            Detalhes Gerais
          </button>
          <button className="pb-3 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            Auditoria
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Informações Identificadoras
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">ID Modelo</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded px-3 py-2">
                    <span className="text-sm font-mono font-medium text-slate-900">0217</span>
                    <Lock className="w-3 h-3 ml-auto text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">SKU (Identificador)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded px-3 py-2 cursor-not-allowed group">
                    <span className="text-sm font-mono font-bold text-slate-600">ULTRA-V2-BL-42</span>
                    <Lock className="w-3 h-3 ml-auto text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Ações de Expansão</p>
                  <p className="text-xs text-slate-500">Este produto é um item SIMPLES. Você pode transformá-lo em outras estruturas.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white text-xs font-bold border border-primary/20 text-primary rounded shadow-sm hover:shadow-md transition-all">
                    CRIAR VARIAÇÃO
                  </button>
                  <button className="px-3 py-1.5 bg-white text-xs font-bold border border-primary/20 text-primary rounded shadow-sm hover:shadow-md transition-all">
                    CRIAR KIT
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Atributos e Composição
              </h3>
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">SKU Base (Pai)</label>
                  <div className="flex items-center">
                    <a className="text-sm font-medium text-primary hover:underline flex items-center gap-1" href="#">
                        ULTRA-V2-MASTER
                        <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Atributos Definidos</label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-50 text-[10px] font-bold rounded text-slate-700">COR: AZUL</span>
                    <span className="px-2 py-1 bg-slate-50 text-[10px] font-bold rounded text-slate-700">TAMANHO: 42</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Itens Vinculados (Estrutura de Kit)</p>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-y border-slate-100">
                    <tr>
                      <th className="py-2 px-4 font-semibold text-xs text-slate-500">ID SKU</th>
                      <th className="py-2 px-4 font-semibold text-xs text-center text-slate-500">QTDE</th>
                      <th className="py-2 px-4 font-semibold text-xs text-slate-500">PREÇO BASE</th>
                      <th className="py-2 px-4 font-semibold text-xs text-right text-slate-500">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">PROD-SHOE-LACE-01</td>
                      <td className="py-3 px-4 text-center text-slate-600">01</td>
                      <td className="py-3 px-4 text-slate-500">R$ 15,90</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary hover:text-blue-700">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">ULTRA-V2-BL-42</td>
                      <td className="py-3 px-4 text-center text-slate-600">01</td>
                      <td className="py-3 px-4 text-slate-500">R$ 499,00</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary hover:text-blue-700">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Imagem do SKU</h3>
              <div className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 relative group">
                <img alt="High-performance running sneaker" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAljKEXjo0UoCA_CZ6PXu1kqBIPoCqO2A23HCpI3SHzE60Yr7CVozPEqa6Cl5I4qrrYuB_lE4y58Fb3xVCAatuXHr1fTeCiA_b87a9XWKYnOB-UH4M4YBbyovVm4U_bvTR_JKmwbCpSAsZoSMAWAynJBaP6oJvlA52CQaJjD7L3QvF7uSukcStSA1fouQtuM3qNPZ39Ja5DJozjr6GIWVnhffElVKa5hO7q1cpKA2fxcJ5Ng9Q5ObWP9ZTOV2p7erITewKv3FQ0UMKb"/>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="bg-white text-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Resumo Comercial</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Estoque Total</span>
                  <span className="text-sm font-bold text-slate-900">142 un.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Vendas (30 dias)</span>
                  <span className="text-sm font-bold text-green-600">84 un.</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500 font-bold uppercase">Preço Final</span>
                  <span className="text-lg font-black text-primary">R$ 514,90</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <History className="w-5 h-5 text-primary" />
              Auditoria de Alterações Recentes
            </h2>
            <button className="text-xs font-semibold text-primary hover:underline">Ver log completo</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-semibold text-xs uppercase tracking-tighter text-slate-500">Usuário</th>
                  <th className="py-3 px-6 font-semibold text-xs uppercase tracking-tighter text-slate-500">Data/Hora</th>
                  <th className="py-3 px-6 font-semibold text-xs uppercase tracking-tighter text-slate-500">Campo</th>
                  <th className="py-3 px-6 font-semibold text-xs uppercase tracking-tighter text-slate-500">Valor Antigo</th>
                  <th className="py-3 px-6 font-semibold text-xs uppercase tracking-tighter text-slate-500">Novo Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-2">
                    <img alt="Ricardo" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnpmGSdRu0flvpbb_KkzF7HKPGXo_DHLIvarNDnC5R6T_GNKCbicbguYfTSNxxZQU1NFb6AgU1cjfOzxtpC7Jw_XaOb-6cK891cUDE-FJbAZOGCzVTL_I9eSUpyYhbcT0Bb-zqtukUO1Jywyc_z-mBgN8PDdWZZUGwnR0TFCPHZbFLsDlT808scmE1gOnqEy4odWNYASjBoKCDgNUJ6LSdf3XmYxHx5WCRgKEVp9gzUZGjcKfeV_3HW8vgouOc_9WyhSr6eJCPJxlG"/>
                    <span className="font-medium text-slate-900">Ricardo Admin</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-xs">24/10/2023 14:32</td>
                  <td className="py-4 px-6"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">ESTOQUE</span></td>
                  <td className="py-4 px-6 text-slate-400">120</td>
                  <td className="py-4 px-6 font-bold text-green-600">142</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-2">
                    <img alt="Ana" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt-FKuMN2N5OfavVnZO4LRGCh_Q93-0gtKOYbQ43yBLhOla92H36zxnY7Sy5yN7WghdZuQXyY-XQp7jpLRIHSX-d-iDCru_qXoA8aBp07hjVHP6fwSFOXuS5YETCYKJtUPpZ-dp8ARFQqD0PB9zZXZGYff7C316nn2Cdhi0YW_gFjopStdpjKzqtQLS4eoX56moNzgTJ7w8ii4Lgbk4uPdBEzT1jBTNjE6a0VuZjSWHA7kzTYe_OfbALFSgw1d1NGW6NQZF1EyV6t1"/>
                    <span className="font-medium text-slate-900">Ana Marketing</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-xs">22/10/2023 09:15</td>
                  <td className="py-4 px-6"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">PREÇO_VENDA</span></td>
                  <td className="py-4 px-6 text-slate-400">R$ 499,00</td>
                  <td className="py-4 px-6 font-bold text-primary">R$ 514,90</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;