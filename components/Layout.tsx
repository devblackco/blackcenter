import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Warehouse,
  UploadCloud,
  ShoppingCart,
  Truck,
  Users,
  Menu,
  Network,
  ChevronDown,
  ChevronRight,
  LogOut,
  Tag,
  FolderOpen,
  Building2,
  BookOpen,
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active, className = '' }: { to: string, icon: any, label: string, active: boolean, className?: string }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group mb-1 ${active
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
      } ${className}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(true);
  const [cadastrosOpen, setCadastrosOpen] = useState(true);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirection
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8]">
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 transition-transform absolute md:relative z-20 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg">B</div>
            <span className="font-bold text-lg tracking-tight text-slate-900">BlackCenter</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/produtos" icon={ShoppingBag} label="Produtos" active={location.pathname === '/produtos' || location.pathname === '/produto-detalhe'} />
          <SidebarItem to="/kits" icon={Layers} label="Kits" active={location.pathname === '/kits'} />
          <SidebarItem to="/estoque" icon={Warehouse} label="Estoque" active={location.pathname === '/estoque'} />
          <SidebarItem to="/pedidos" icon={ShoppingCart} label="Pedidos" active={location.pathname === '/pedidos'} />
          <SidebarItem to="/expedicao" icon={Truck} label="Expedição" active={location.pathname === '/expedicao'} />

          {/* Integrations Submenu */}
          <div className="mt-1">
            <button
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                <span className="font-medium">Integrações</span>
              </div>
              {integrationsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {integrationsOpen && (
              <div className="mt-1 space-y-1">
                <SidebarItem
                  to="/exportacoes"
                  icon={UploadCloud}
                  label="Exportações Tiny"
                  active={location.pathname === '/exportacoes'}
                  className="pl-11"
                />
              </div>
            )}
          </div>



          {/* Cadastros Submenu (Admin Only) */}
          {profile?.role === 'ADMIN' && (
            <div className="mt-4">
              <button
                onClick={() => setCadastrosOpen(!cadastrosOpen)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                  <span className="font-medium">Cadastros</span>
                </div>
                {cadastrosOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {cadastrosOpen && (
                <div className="mt-1 space-y-1">
                  <SidebarItem to="/marcas" icon={Tag} label="Marcas" active={location.pathname === '/marcas'} className="pl-11" />
                  <SidebarItem to="/categorias" icon={FolderOpen} label="Categorias" active={location.pathname === '/categorias'} className="pl-11" />
                  <SidebarItem to="/fornecedores" icon={Building2} label="Fornecedores" active={location.pathname === '/fornecedores'} className="pl-11" />
                </div>
              )}
            </div>
          )}

          {/* Configurações Menu (Admin Only) */}
          {profile?.role === 'ADMIN' && (
            <div className="mt-4">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configurações</p>
              <SidebarItem to="/usuarios" icon={Users} label="Usuários" active={location.pathname === '/usuarios'} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/perfil" className="flex items-center gap-3 mb-3 hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')
              )}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden text-left">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || user?.email || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.role === 'ADMIN' ? 'bg-purple-500' :
                  profile?.role === 'EXPEDICAO' ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></span>
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase() : 'Leitor'}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header (Visible mostly on mobile for menu toggling, but useful for standardizing page layout) */}
        <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-slate-900">BlackCenter</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};