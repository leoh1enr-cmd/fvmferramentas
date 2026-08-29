export type ToolCategory = 'eletrica' | 'manual' | 'combustao' | 'bancada' | 'medicao' | 'acessorios' | 'outros';

export type ToolPowerType = 'eletrica_cabo' | 'bateria' | 'manual' | 'gasolina' | 'pneumatica';

export type ToolVoltage = '110V' | '220V' | 'Bivolt' | 'Bateria' | 'N/A';

export type ToolCondition = 'novo' | 'excelente' | 'bom' | 'marcas_uso' | 'em_manutencao';

export type ToolStatus = 'disponivel' | 'locado' | 'manutencao' | 'desativado';

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  brand: string;
  model: string;
  serialNumber: string;
  powerType: ToolPowerType;
  voltage: ToolVoltage;
  dailyPrice: number; // Valor sugerido da diária em R$
  replacementValue: number; // Valor da máquina em caso de extravio/dano total em R$
  defaultLateFeePerDay: number; // Multa diária sugerida por atraso em R$
  condition: ToolCondition;
  status: ToolStatus;
  notes?: string;
  accessoriesIncluded?: string; // Itens que acompanham (ex: Maleta, 2 baterias, carregador, chave de mandril)
  imageUrl?: string;
  currentRentalId?: string;
  createdAt: string;
}

export type DocumentType = 'CPF' | 'CNPJ';

export interface ClientAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Client {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string; // CPF ou CNPJ
  rgIe?: string; // RG ou Inscrição Estadual
  phone: string;
  whatsapp: string;
  email: string;
  address: ClientAddress;
  notes?: string;
  createdAt: string;
}

export interface CompanyProfile {
  tradeName: string; // Nome Fantasia
  legalName: string; // Razão Social
  cnpjCpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: ClientAddress;
  pixKey: string;
  pixKeyType: 'CNPJ' | 'CPF' | 'Telefone' | 'E-mail' | 'Aleatória';
  representativeName: string;
  representativeRole: string;
  defaultLateFeePerDay: number; // Multa padrão por dia de atraso (R$)
  defaultLateFeePercent: number; // Multa % por atraso
  customClauses: string[];
}

export type RentalStatus = 'ativa' | 'vencida' | 'devolvida' | 'cancelada' | 'renovada';

export interface RentalRenewal {
  id: string;
  date: string; // YYYY-MM-DD
  additionalDays: number;
  previousExpectedEndDate: string;
  newExpectedEndDate: string;
  additionalValue: number;
  notes?: string;
}

export interface RentalToolItem {
  toolId: string;
  toolSnapshot: {
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    powerType: ToolPowerType;
    voltage: ToolVoltage;
    accessoriesIncluded?: string;
    condition: ToolCondition;
  };
  dailyPrice: number;
  replacementValue: number; // Valor da máquina em caso de extravio
  quantity: number;
}

export interface RentalContract {
  id: string;
  contractNumber: string; // Ex: LOC-2026-001
  clientId: string;
  clientSnapshot: Client;
  companySnapshot: CompanyProfile;
  
  // Tools in this rental
  tools: RentalToolItem[];
  
  // Period and Values
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  rentalDays: number; // Campo de dias aberto!
  expectedEndDate: string; // YYYY-MM-DD
  
  dailyRateTotal: number; // Soma das diárias
  baseRentalValue: number; // dailyRateTotal * rentalDays ou valor customizado
  discountValue: number;
  depositValue: number; // Valor de caução (se houver)
  totalRentalValue: number; // Valor final acordado
  
  // Penalties and Extravio
  lateFeePerDay: number; // Multa diária por atraso em R$
  lateFeePercent: number; // Multa percentual sobre o total
  totalReplacementValue: number; // Soma do valor das máquinas caso extravie
  
  paymentMethod: 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'a_combinar';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  
  status: RentalStatus;
  
  // Return info
  returnedDate?: string;
  returnCondition?: ToolCondition;
  returnNotes?: string;
  calculatedLateDays?: number;
  appliedLateFee?: number;
  finalPaidAmount?: number;
  isExtraviado?: boolean;
  extravioPaidAmount?: number;
  
  // Renewals history
  renewals: RentalRenewal[];
  
  // Signatures & Notes
  clientSignature?: string; // Data URL or text
  specialConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  dueTodayRentals: number;
  overdueRentals: number;
  completedRentals: number;
  totalRevenue: number;
  totalTools: number;
  availableTools: number;
  rentedTools: number;
  maintenanceTools: number;
}

export type NotificationType = '5_days_before' | 'due_today' | 'overdue' | 'test';

export interface PushNotificationRecord {
  id: string;
  contractId?: string;
  contractNumber?: string;
  clientName?: string;
  type: NotificationType;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
}

