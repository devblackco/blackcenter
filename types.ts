export type UserRole = 'ADMIN' | 'EXPEDICAO' | 'LEITOR';
export type UserStatus = 'PENDENTE' | 'ATIVO' | 'BLOQUEADO';

export interface Profile {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  initials: string;
}

export interface Order {
  id: string;
  tinyId: string;
  date: string;
  statusReserva: 'Separando' | 'Reservado' | 'Atrasado' | 'Pendente';
  origin: string;
  itemsCount: number;
  timeInQueue: string;
}

export interface Product {
  sku: string;
  name: string;
  type: 'PAI' | 'SIMPLES' | 'VARIAÇÃO' | 'KIT';
  status: 'Ativo' | 'Rascunho';
  stock: number;
  reserved: number;
  minStock: number;
  image?: string;
}

export interface ExpedicaoItem {
  id: string;
  pedNumber: string;
  items: {
    name: string;
    sku: string;
    qty: number;
    image: string;
  }[];
  local: string;
  time: string;
  status: 'Separando' | 'Pago' | 'Pendente';
  isLate?: boolean;
}

export interface ExportBatch {
  id: string;
  date: string;
  status: 'Confirmado' | 'Gerado' | 'Erro Validação';
  itemsCount: number;
}

export interface Kit {
  sku: string;
  name: string;
  componentsText: string;
  stockCalc: number;
  numComponents: number;
  status: 'Ativo' | 'Baixo Est.' | 'Pausado';
  stockWarning?: boolean;
}