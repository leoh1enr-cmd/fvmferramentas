import { Client, CompanyProfile, RentalContract, Tool } from '../types';
import { initialClients, initialCompanyProfile, initialContracts, initialTools } from '../data/initialData';

const STORAGE_KEYS = {
  TOOLS: 'locaferramentas_tools_v1',
  CLIENTS: 'locaferramentas_clients_v1',
  CONTRACTS: 'locaferramentas_contracts_v1',
  COMPANY: 'locaferramentas_company_v1',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading key ${key} from storage:`, error);
    return fallback;
  }
}

// Safe JSON writer
function safeWrite<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving key ${key} to storage:`, error);
  }
}

// ---------------- TOOLS ----------------
export function getStoredTools(): Tool[] {
  return safeParse<Tool[]>(STORAGE_KEYS.TOOLS, initialTools);
}

export function saveStoredTools(tools: Tool[]): void {
  safeWrite(STORAGE_KEYS.TOOLS, tools);
}

// ---------------- CLIENTS ----------------
export function getStoredClients(): Client[] {
  return safeParse<Client[]>(STORAGE_KEYS.CLIENTS, initialClients);
}

export function saveStoredClients(clients: Client[]): void {
  safeWrite(STORAGE_KEYS.CLIENTS, clients);
}

// ---------------- CONTRACTS ----------------
export function getStoredContracts(): RentalContract[] {
  return safeParse<RentalContract[]>(STORAGE_KEYS.CONTRACTS, initialContracts);
}

export function saveStoredContracts(contracts: RentalContract[]): void {
  safeWrite(STORAGE_KEYS.CONTRACTS, contracts);
}

// ---------------- COMPANY ----------------
export function getStoredCompany(): CompanyProfile {
  return safeParse<CompanyProfile>(STORAGE_KEYS.COMPANY, initialCompanyProfile);
}

export function saveStoredCompany(company: CompanyProfile): void {
  safeWrite(STORAGE_KEYS.COMPANY, company);
}

// ---------------- NEXT CONTRACT NUMBER ----------------
export function generateNextContractNumber(contracts: RentalContract[]): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `LOC-${currentYear}-`;
  
  let maxSeq = 0;
  contracts.forEach(c => {
    if (c.contractNumber && c.contractNumber.startsWith(yearPrefix)) {
      const seqStr = c.contractNumber.replace(yearPrefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${yearPrefix}${nextSeq}`;
}

// ---------------- BACKUP / RESTORE ----------------
export function exportAllDataJson(): string {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tools: getStoredTools(),
    clients: getStoredClients(),
    contracts: getStoredContracts(),
    company: getStoredCompany(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importAllDataJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.tools && Array.isArray(data.tools)) {
      saveStoredTools(data.tools);
    }
    if (data.clients && Array.isArray(data.clients)) {
      saveStoredClients(data.clients);
    }
    if (data.contracts && Array.isArray(data.contracts)) {
      saveStoredContracts(data.contracts);
    }
    if (data.company) {
      saveStoredCompany(data.company);
    }
    return true;
  } catch (error) {
    console.error('Failed to import backup:', error);
    return false;
  }
}

export function resetAllDataToDemo(): void {
  saveStoredTools(initialTools);
  saveStoredClients(initialClients);
  saveStoredContracts(initialContracts);
  saveStoredCompany(initialCompanyProfile);
}
