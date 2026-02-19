import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import ProfilePage from './pages/Profile';
import Expedicao from './pages/Expedicao';
import Pedidos from './pages/Pedidos';
import ExportacoesTiny from './pages/ExportacoesTiny';
import Usuarios from './pages/Usuarios';
import Estoque from './pages/Estoque';
import Kits from './pages/Kits';
import ProductsMaster from './pages/ProductsMaster';
import ProductDetail from './pages/ProductDetail';
import NewSimpleProduct from './pages/NewSimpleProduct';
import Pending from './pages/Pending';
import ResetPassword from './pages/ResetPassword';
import Marcas from './pages/Marcas';
import Categorias from './pages/Categorias';
import Fornecedores from './pages/Fornecedores';
import NewParentProduct from './pages/NewParentProduct';
import NewVariation from './pages/NewVariation';
import NewKit from './pages/NewKit';

// Dashboard component
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-slate-900 mb-4">Dashboard</h1>
    <p className="text-slate-500">Bem-vindo ao BlackCenter ERP. Selecione um menu lateral para começar.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-slate-500 text-sm font-medium">Vendas Hoje</h3>
        <p className="text-3xl font-bold text-slate-900 mt-2">R$ 14.230</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-slate-500 text-sm font-medium">Pedidos Pendentes</h3>
        <p className="text-3xl font-bold text-slate-900 mt-2">42</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-slate-500 text-sm font-medium">SKUs Críticos</h3>
        <p className="text-3xl font-bold text-red-600 mt-2">24</p>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ─── Public Routes ─── */}
          <Route path="/login" element={<Login />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/acesso-negado" element={<AccessDenied />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ─── Protected Routes (auth required, profile must be ATIVO) ─── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="perfil" element={<ProfilePage />} />

              {/* LEITOR+ access */}
              <Route path="produtos" element={<ProtectedRoute requiredRole="LEITOR"><ProductsMaster /></ProtectedRoute>} />
              <Route path="produtos/novo" element={<ProtectedRoute requiredRole="EXPEDICAO"><NewSimpleProduct /></ProtectedRoute>} />
              <Route path="produtos/novo-pai" element={<ProtectedRoute requiredRole="EXPEDICAO"><NewParentProduct /></ProtectedRoute>} />
              <Route path="produtos/nova-variacao" element={<ProtectedRoute requiredRole="EXPEDICAO"><NewVariation /></ProtectedRoute>} />
              <Route path="produto-detalhe" element={<ProtectedRoute requiredRole="LEITOR"><ProductDetail /></ProtectedRoute>} />
              <Route path="kits" element={<ProtectedRoute requiredRole="LEITOR"><Kits /></ProtectedRoute>} />
              <Route path="kits/novo" element={<ProtectedRoute requiredRole="EXPEDICAO"><NewKit /></ProtectedRoute>} />

              {/* EXPEDICAO+ access */}
              <Route path="pedidos" element={<ProtectedRoute requiredRole="EXPEDICAO"><Pedidos /></ProtectedRoute>} />
              <Route path="expedicao" element={<ProtectedRoute requiredRole="EXPEDICAO"><Expedicao /></ProtectedRoute>} />
              <Route path="estoque" element={<ProtectedRoute requiredRole="EXPEDICAO"><Estoque /></ProtectedRoute>} />

              {/* ADMIN only */}
              <Route path="usuarios" element={<ProtectedRoute requiredRole="ADMIN"><Usuarios /></ProtectedRoute>} />
              <Route path="exportacoes" element={<ProtectedRoute requiredRole="ADMIN"><ExportacoesTiny /></ProtectedRoute>} />
              <Route path="marcas" element={<ProtectedRoute requiredRole="ADMIN"><Marcas /></ProtectedRoute>} />
              <Route path="categorias" element={<ProtectedRoute requiredRole="ADMIN"><Categorias /></ProtectedRoute>} />
              <Route path="fornecedores" element={<ProtectedRoute requiredRole="ADMIN"><Fornecedores /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;