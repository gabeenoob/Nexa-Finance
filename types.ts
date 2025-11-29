

export type AccountType = 'personal' | 'business'; // Mantido para retrocompatibilidade visual, mas agora vinculado ao Workspace type
export type Role = 'owner' | 'admin' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  type: AccountType;
  ownerId: string;
  created_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string | null; // Pode ser null se for um convite pendente por email
  email: string;
  role: Role;
  user?: {
    full_name?: string;
    avatar_url?: string;
  }
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: Date;
  category: string;
  tags: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  source?: string; 
  destination?: string;
  accountId: AccountType; // Legacy visual field
  workspaceId?: string; // New relational field
  projectId?: string; // Linked Project ID
}

export interface FixedCostTemplate {
  id: string;
  name: string;
  defaultAmount: number;
  dayOfMonth: number;
  isTax?: boolean;
}

export interface BusinessConfig {
  fixedCostTemplates: FixedCostTemplate[];
}

export interface CashAllocations {
    workingCapital: number; // Target amount for Giro
    operationalReserve: number; // Remaining/Buffer
}

export interface CashFlowConfig {
  allocations: CashAllocations;
  workingCapitalPercent?: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  document: string; // CPF or CNPJ
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  startDate: Date; 
  deadline?: Date;
  status?: string; 
  value: number; 
  description?: string;
  linkedTransactionId?: string;
}

export interface AccountSettings {
  name: string;
  categories: Category[];
  tags: Tag[];
  cashFlow: CashFlowConfig;
  avatarUrl?: string; // URL for the profile image/logo
}

export interface AppSettings {
  personal: AccountSettings;
  business: AccountSettings;
}