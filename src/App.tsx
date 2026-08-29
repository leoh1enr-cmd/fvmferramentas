import React, { useState, useEffect } from 'react';
import { Client, CompanyProfile, RentalContract, RentalStatus, Tool, ToolCondition } from './types';
import { 
  getStoredClients, 
  getStoredCompany, 
  getStoredContracts, 
  getStoredTools, 
  saveStoredClients, 
  saveStoredCompany, 
  saveStoredContracts, 
  saveStoredTools 
} from './utils/storage';
import { addDaysToDate, calculateDaysBetween, getRentalDueStatus, getTodayString } from './utils/formatters';
import { checkAndSendRentalNotifications } from './utils/notifications';
import { isUserAuthenticated, logoutUser } from './utils/auth';
import { Header, NavTab } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ContractGenerator } from './components/ContractGenerator';
import { RentalHistory } from './components/RentalHistory';
import { RemindersPanel } from './components/RemindersPanel';
import { ToolManager } from './components/ToolManager';
import { ClientManager } from './components/ClientManager';
import { CompanySettings } from './components/CompanySettings';
import { ContractViewModal } from './components/ContractViewModal';
import { RenewalModal } from './components/RenewalModal';
import { ReturnModal } from './components/ReturnModal';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());

  // Main State
  const [tools, setTools] = useState<Tool[]>(() => getStoredTools());
  const [clients, setClients] = useState<Client[]>(() => getStoredClients());
  const [contracts, setContracts] = useState<RentalContract[]>(() => getStoredContracts());
  const [company, setCompany] = useState<CompanyProfile>(() => getStoredCompany());

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals
  const [viewingContract, setViewingContract] = useState<RentalContract | null>(null);
  const [renewingContract, setRenewingContract] = useState<RentalContract | null>(null);
  const [returningContract, setReturningContract] = useState<RentalContract | null>(null);

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  // Sync state to LocalStorage
  const updateToolsState = (newTools: Tool[]) => {
    setTools(newTools);
    saveStoredTools(newTools);
  };

  const updateClientsState = (newClients: Client[]) => {
    setClients(newClients);
    saveStoredClients(newClients);
  };

  const updateContractsState = (newContracts: RentalContract[]) => {
    setContracts(newContracts);
    saveStoredContracts(newContracts);
  };

  const updateCompanyState = (newCompany: CompanyProfile) => {
    setCompany(newCompany);
    saveStoredCompany(newCompany);
  };

  // Reload all from storage (after backup restore or demo reset)
  const handleReloadAll = () => {
    setTools(getStoredTools());
    setClients(getStoredClients());
    setContracts(getStoredContracts());
    setCompany(getStoredCompany());
  };

  // Automated Push Notifications: check on load and periodic timer
  useEffect(() => {
    // Run automated check 5 days before, due today, and overdue
    checkAndSendRentalNotifications(contracts);

    // Periodic check every 10 minutes
    const interval = setInterval(() => {
      checkAndSendRentalNotifications(contracts);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [contracts]);

  // Calculate active alerts count (overdue, due today, or due in 5 days)
  const todayStr = getTodayString();
  const alertCount = contracts.filter(c => {
    if (c.status === 'devolvida' || c.status === 'cancelada') return false;
    const diff = calculateDaysBetween(todayStr, c.expectedEndDate);
    return diff <= 0 || diff === 5; // Overdue, due today, or 5-day reminder
  }).length;

  // ---------------- CONTRACT HANDLERS ----------------
  const handleSaveNewContract = (newContract: RentalContract, updatedTools: Tool[]) => {
    const nextContracts = [newContract, ...contracts];
    updateContractsState(nextContracts);
    updateToolsState(updatedTools);
  };

  const handleConfirmRenewal = (
    contractId: string,
    additionalDays: number,
    additionalValue: number,
    notes: string
  ) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    const newExpectedEndDate = addDaysToDate(contract.expectedEndDate, additionalDays);
    const newTotalDays = contract.rentalDays + additionalDays;
    const newTotalValue = contract.totalRentalValue + additionalValue;

    const renewalRecord = {
      id: `ren-${Date.now()}`,
      date: getTodayString(),
      additionalDays,
      previousExpectedEndDate: contract.expectedEndDate,
      newExpectedEndDate,
      additionalValue,
      notes,
    };

    const updatedContract: RentalContract = {
      ...contract,
      rentalDays: newTotalDays,
      expectedEndDate: newExpectedEndDate,
      totalRentalValue: newTotalValue,
      status: 'ativa', // Re-activates if was overdue
      renewals: [...(contract.renewals || []), renewalRecord],
      updatedAt: new Date().toISOString(),
    };

    const updatedContracts = contracts.map(c => c.id === contractId ? updatedContract : c);
    updateContractsState(updatedContracts);
  };

  const handleConfirmReturn = (
    contractId: string,
    returnData: {
      returnedDate: string;
      returnCondition: ToolCondition;
      returnNotes: string;
      calculatedLateDays: number;
      appliedLateFee: number;
      isExtraviado: boolean;
      extravioPaidAmount: number;
      finalPaidAmount: number;
    }
  ) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    // Update contract
    const updatedContract: RentalContract = {
      ...contract,
      status: 'devolvida',
      returnedDate: returnData.returnedDate,
      returnCondition: returnData.returnCondition,
      returnNotes: returnData.returnNotes,
      calculatedLateDays: returnData.calculatedLateDays,
      appliedLateFee: returnData.appliedLateFee,
      isExtraviado: returnData.isExtraviado,
      extravioPaidAmount: returnData.extravioPaidAmount,
      finalPaidAmount: returnData.finalPaidAmount,
      updatedAt: new Date().toISOString(),
    };

    const updatedContracts = contracts.map(c => c.id === contractId ? updatedContract : c);
    updateContractsState(updatedContracts);

    // Free tools status back to 'disponivel' (or 'manutencao' if damaged)
    const toolIdsInContract = contract.tools.map(t => t.toolId);
    const updatedTools = tools.map(tool => {
      if (toolIdsInContract.includes(tool.id)) {
        return {
          ...tool,
          status: (returnData.returnCondition === 'em_manutencao' || returnData.isExtraviado)
            ? ('manutencao' as const)
            : ('disponivel' as const),
          condition: returnData.returnCondition,
          currentRentalId: undefined,
        };
      }
      return tool;
    });

    updateToolsState(updatedTools);
  };

  const handleDeleteContract = (contractId: string) => {
    const target = contracts.find(c => c.id === contractId);
    if (target && target.status !== 'devolvida') {
      // Free tools
      const toolIds = target.tools.map(t => t.toolId);
      const updatedTools = tools.map(t => {
        if (toolIds.includes(t.id)) {
          return { ...t, status: 'disponivel' as const, currentRentalId: undefined };
        }
        return t;
      });
      updateToolsState(updatedTools);
    }
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    updateContractsState(updatedContracts);
  };

  // ---------------- TOOL HANDLERS ----------------
  const handleSaveTool = (toolToSave: Tool) => {
    const exists = tools.some(t => t.id === toolToSave.id);
    const updated = exists
      ? tools.map(t => t.id === toolToSave.id ? toolToSave : t)
      : [toolToSave, ...tools];
    updateToolsState(updated);
  };

  const handleDeleteTool = (toolId: string) => {
    const updated = tools.filter(t => t.id !== toolId);
    updateToolsState(updated);
  };

  // ---------------- CLIENT HANDLERS ----------------
  const handleSaveClient = (clientToSave: Client) => {
    const exists = clients.some(c => c.id === clientToSave.id);
    const updated = exists
      ? clients.map(c => c.id === clientToSave.id ? clientToSave : c)
      : [clientToSave, ...clients];
    updateClientsState(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    updateClientsState(updated);
  };

  // If not authenticated, display the Password Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Frosted Atmospheric Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Navigation */}
      <div className="relative z-40">
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          company={company}
          alertCount={alertCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            tools={tools}
            clients={clients}
            contracts={contracts}
            company={company}
            onNavigateTab={setActiveTab}
            onViewContract={(c) => setViewingContract(c)}
            onOpenRenewalModal={(c) => setRenewingContract(c)}
            onOpenReturnModal={(c) => setReturningContract(c)}
          />
        )}

        {activeTab === 'generator' && (
          <ContractGenerator
            tools={tools}
            clients={clients}
            company={company}
            contracts={contracts}
            onSaveContract={handleSaveNewContract}
            onQuickAddClient={handleSaveClient}
            onGoToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <RentalHistory
            contracts={contracts}
            onViewContract={(c) => setViewingContract(c)}
            onOpenRenewalModal={(c) => setRenewingContract(c)}
            onOpenReturnModal={(c) => setReturningContract(c)}
            onDeleteContract={handleDeleteContract}
            onNewRental={() => setActiveTab('generator')}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersPanel
            contracts={contracts}
            onOpenRenewalModal={(c) => setRenewingContract(c)}
            onOpenReturnModal={(c) => setReturningContract(c)}
            onViewContract={(c) => setViewingContract(c)}
          />
        )}

        {activeTab === 'tools' && (
          <ToolManager
            tools={tools}
            contracts={contracts}
            onSaveTool={handleSaveTool}
            onDeleteTool={handleDeleteTool}
          />
        )}

        {activeTab === 'clients' && (
          <ClientManager
            clients={clients}
            contracts={contracts}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'company' && (
          <CompanySettings
            company={company}
            onSaveCompany={updateCompanyState}
            onReloadData={handleReloadAll}
          />
        )}
      </main>

      {/* Contract Viewer Modal (for printing, sharing, PDF) */}
      <ContractViewModal
        contract={viewingContract}
        isOpen={!!viewingContract}
        onClose={() => setViewingContract(null)}
      />

      {/* Renewal Modal */}
      <RenewalModal
        contract={renewingContract}
        isOpen={!!renewingContract}
        onClose={() => setRenewingContract(null)}
        onConfirmRenewal={handleConfirmRenewal}
      />

      {/* Return & Inspection Modal */}
      <ReturnModal
        contract={returningContract}
        isOpen={!!returningContract}
        onClose={() => setReturningContract(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Footer */}
      <footer className="no-print bg-slate-900/50 backdrop-blur-md border-t border-white/10 py-4 px-6 text-center text-xs text-slate-400 relative z-10">
        <p>
          FVM Ferramentas • Floresta Verde Madeiras • Sistema de Gestão de Ferramentas, Locações, Contratos e Notificações Push
        </p>
      </footer>
    </div>
  );
}
