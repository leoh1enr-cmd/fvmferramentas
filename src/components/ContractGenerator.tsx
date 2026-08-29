import React, { useState, useEffect } from 'react';
import { Client, CompanyProfile, RentalContract, RentalToolItem, Tool } from '../types';
import { addDaysToDate, formatCurrency, formatDateBR, formatDocument, formatPhone, getPowerTypeLabel, getTodayString } from '../utils/formatters';
import { generateNextContractNumber } from '../utils/storage';
import { ContractDocument } from './ContractDocument';
import { 
  FilePlus, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  Wrench, 
  Plus, 
  Trash2, 
  Eye, 
  Printer, 
  Check, 
  Sparkles,
  UserPlus
} from 'lucide-react';

interface ContractGeneratorProps {
  tools: Tool[];
  clients: Client[];
  company: CompanyProfile;
  contracts: RentalContract[];
  onSaveContract: (contract: RentalContract, updatedTools: Tool[]) => void;
  onQuickAddClient: (newClient: Client) => void;
  onGoToHistory: () => void;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  tools,
  clients,
  company,
  contracts,
  onSaveContract,
  onQuickAddClient,
  onGoToHistory,
}) => {
  // 1. Client selection / Quick create
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [showQuickClientModal, setShowQuickClientModal] = useState<boolean>(false);
  const [quickClientName, setQuickClientName] = useState<string>('');
  const [quickClientDoc, setQuickClientDoc] = useState<string>('');
  const [quickClientPhone, setQuickClientPhone] = useState<string>('');
  const [quickClientAddress, setQuickClientAddress] = useState<string>('');

  // 2. Selected Tools (Can select one or multiple)
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(() => {
    const available = tools.find(t => t.status === 'disponivel');
    return available ? [available.id] : (tools[0] ? [tools[0].id] : []);
  });

  // 3. Rental Period (CAMPO DE DIAS ABERTO)
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [rentalDays, setRentalDays] = useState<number>(3); // Campo aberto!
  const [expectedEndDate, setExpectedEndDate] = useState<string>(() => addDaysToDate(getTodayString(), 3));

  // 4. Financials & Custom Values
  const [customDailyRate, setCustomDailyRate] = useState<number | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [depositValue, setDepositValue] = useState<number>(0);
  const [customLateFeePerDay, setCustomLateFeePerDay] = useState<number>(company.defaultLateFeePerDay || 25);
  const [customLateFeePercent, setCustomLateFeePercent] = useState<number>(company.defaultLateFeePercent || 2);
  const [customReplacementValue, setCustomReplacementValue] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'a_combinar'>('pix');
  const [specialConditions, setSpecialConditions] = useState<string>('');

  // UI state
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [savedContractPreview, setSavedContractPreview] = useState<RentalContract | null>(null);

  // Update expectedEndDate whenever startDate or rentalDays changes
  useEffect(() => {
    const validDays = Math.max(1, rentalDays);
    const newEnd = addDaysToDate(startDate, validDays);
    setExpectedEndDate(newEnd);
  }, [startDate, rentalDays]);

  // Selected tool objects
  const selectedToolsList = tools.filter(t => selectedToolIds.includes(t.id));

  // Calculate default sums from selected tools
  const defaultDailyTotal = selectedToolsList.reduce((acc, t) => acc + (t.dailyPrice || 0), 0);
  const defaultReplacementTotal = selectedToolsList.reduce((acc, t) => acc + (t.replacementValue || 0), 0);
  const defaultLateFee = selectedToolsList.length > 0 
    ? Math.max(...selectedToolsList.map(t => t.defaultLateFeePerDay || 25))
    : (company.defaultLateFeePerDay || 25);

  const effectiveDailyRate = customDailyRate !== null ? customDailyRate : defaultDailyTotal;
  const effectiveReplacementValue = customReplacementValue !== null ? customReplacementValue : defaultReplacementTotal;
  
  const baseRentalValue = effectiveDailyRate * Math.max(1, rentalDays);
  const totalRentalValue = Math.max(0, baseRentalValue - discountValue);

  // Quick preset days
  const handleSetDays = (days: number) => {
    setRentalDays(days);
  };

  const handleToggleTool = (toolId: string) => {
    if (selectedToolIds.includes(toolId)) {
      if (selectedToolIds.length > 1) {
        setSelectedToolIds(selectedToolIds.filter(id => id !== toolId));
      }
    } else {
      setSelectedToolIds([...selectedToolIds, toolId]);
    }
  };

  const handleQuickAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: quickClientName,
      documentType: quickClientDoc.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
      documentNumber: quickClientDoc,
      phone: quickClientPhone,
      whatsapp: quickClientPhone,
      email: '',
      address: {
        street: quickClientAddress || 'Endereço Comercial / Residencial',
        number: 'S/N',
        neighborhood: 'Centro',
        city: company.address.city || 'São Paulo',
        state: company.address.state || 'SP',
        zipCode: '00000-000',
      },
      createdAt: new Date().toISOString(),
    };

    onQuickAddClient(newClient);
    setSelectedClientId(newClient.id);
    setShowQuickClientModal(false);
    setQuickClientName('');
    setQuickClientDoc('');
    setQuickClientPhone('');
    setQuickClientAddress('');
  };

  // Build the temporary or final contract object
  const buildContractObject = (): RentalContract | null => {
    const client = clients.find(c => c.id === selectedClientId) || clients[0];
    if (!client || selectedToolsList.length === 0) return null;

    const contractTools: RentalToolItem[] = selectedToolsList.map(t => ({
      toolId: t.id,
      toolSnapshot: {
        name: t.name,
        brand: t.brand,
        model: t.model,
        serialNumber: t.serialNumber,
        powerType: t.powerType,
        voltage: t.voltage,
        accessoriesIncluded: t.accessoriesIncluded,
        condition: t.condition,
      },
      dailyPrice: t.dailyPrice,
      replacementValue: t.replacementValue,
      quantity: 1,
    }));

    return {
      id: `contract-${Date.now()}`,
      contractNumber: generateNextContractNumber(contracts),
      clientId: client.id,
      clientSnapshot: client,
      companySnapshot: company,
      tools: contractTools,
      startDate,
      rentalDays: Math.max(1, rentalDays),
      expectedEndDate,
      dailyRateTotal: effectiveDailyRate,
      baseRentalValue,
      discountValue,
      depositValue,
      totalRentalValue,
      lateFeePerDay: customLateFeePerDay,
      lateFeePercent: customLateFeePercent,
      totalReplacementValue: effectiveReplacementValue,
      paymentMethod,
      paymentStatus: 'pago',
      status: 'ativa',
      renewals: [],
      specialConditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleGenerateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const contract = buildContractObject();
    if (!contract) return;

    // Update the tools status to 'locado'
    const updatedTools = tools.map(t => {
      if (selectedToolIds.includes(t.id)) {
        return {
          ...t,
          status: 'locado' as const,
          currentRentalId: contract.id,
        };
      }
      return t;
    });

    onSaveContract(contract, updatedTools);
    setSavedContractPreview(contract);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <FilePlus className="w-5 h-5" />
            </span>
            Emitir Novo Contrato de Locação
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Preencha os dados do cliente, selecione os equipamentos e configure os dias, multas e valores de reposição.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToHistory}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm"
          >
            Ver Histórico de Locações
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Summary on Right */}
      <form onSubmit={handleGenerateContract} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Form controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: LOCATÁRIO (CLIENTE) */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Dados do Locatário (Cliente)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickClientModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all backdrop-blur-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Novo Locatário</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Selecione o Cliente / Locatário
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl font-medium text-white text-sm focus:ring-1 focus:ring-amber-400"
                required
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-slate-900 text-white">
                    {client.name} — {client.documentType}: {formatDocument(client.documentNumber)} ({formatPhone(client.whatsapp || client.phone)})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Client Card Details */}
            {selectedClient && (
              <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/10 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Documento / Contato</span>
                  <span className="font-semibold text-white">{selectedClient.documentType}: {formatDocument(selectedClient.documentNumber)}</span>
                  <p className="text-amber-400 font-mono text-[11px] mt-0.5">{formatPhone(selectedClient.whatsapp || selectedClient.phone)}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Endereço de Entrega / Cadastro</span>
                  <p className="text-slate-200 line-clamp-2">
                    {selectedClient.address.street}, {selectedClient.address.number} - {selectedClient.address.neighborhood}, {selectedClient.address.city}/{selectedClient.address.state}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: SELEÇÃO DE FERRAMENTAS ELÉTRICAS E MANUAIS */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Ferramentas e Máquinas Locadas
                </h2>
              </div>
              <span className="text-xs font-semibold text-amber-400">
                {selectedToolIds.length} selecionada(s)
              </span>
            </div>

            {/* Tools Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {tools.map(tool => {
                const isSelected = selectedToolIds.includes(tool.id);
                const isRented = tool.status === 'locado';
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToggleTool(tool.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400/80 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50 backdrop-blur-md'
                        : isRented
                        ? 'border-white/5 bg-slate-900/40 opacity-60'
                        : 'glass-panel-subtle hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 block">
                          {tool.category.toUpperCase()} • {getPowerTypeLabel(tool.powerType, tool.voltage)}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{tool.name}</h4>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {tool.brand} {tool.model} {tool.serialNumber ? `(S/N: ${tool.serialNumber})` : ''}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'border border-white/20 bg-slate-950/40'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400">Diária: </span>
                        <strong className="text-emerald-400 font-bold">{formatCurrency(tool.dailyPrice)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Extravio: </span>
                        <strong className="text-amber-300 font-semibold">{formatCurrency(tool.replacementValue)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PRAZO DE LOCAÇÃO (CAMPO DE DIA ABERTO) */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Prazo da Locação (Dias e Datas)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data de Início / Retirada
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm font-medium text-white focus:ring-1 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              {/* CAMPO DE DIAS ABERTO (HIGHLIGHT) */}
              <div>
                <label className="block text-xs font-black text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quantidade de Dias a Locar</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-amber-500/15 border-2 border-amber-400 rounded-xl text-lg font-black text-amber-300 text-center shadow-lg shadow-amber-500/10 focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Calculated Expected End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Previsão de Devolução
                </label>
                <div className="px-3.5 py-2.5 glass-panel-subtle rounded-xl font-black text-white text-sm text-center border border-white/10">
                  {formatDateBR(expectedEndDate)}
                </div>
              </div>
            </div>

            {/* Quick Days presets buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Atalhos rápidos de período:
              </span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7, 10, 15, 20, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSetDays(days)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                      rentalDays === days
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'glass-panel-subtle hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {days} {days === 1 ? 'dia' : 'dias'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: MULTA POR ATRASO & VALOR DE EXTRAVIO */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center">4</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Multa por Atraso & Valor de Extravio das Máquinas</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Late fee per day */}
              <div className="p-3.5 bg-rose-950/40 rounded-xl border border-rose-500/30 space-y-1.5 backdrop-blur-md">
                <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                  ⚠️ Multa Diária por Atraso (R$/dia)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-medium text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customLateFeePerDay}
                    onChange={(e) => setCustomLateFeePerDay(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950/60 border border-rose-500/40 rounded-lg text-sm font-bold text-rose-300 focus:ring-1 focus:ring-rose-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-rose-300/80 leading-tight">
                  Cobrada por dia de atraso além da data prevista ({formatDateBR(expectedEndDate)}).
                </p>
              </div>

              {/* Machine Extravio / Replacement value */}
              <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/30 space-y-1.5 backdrop-blur-md">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  🛡️ Valor da Máquina (Extravio / Perda)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-medium text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={effectiveReplacementValue}
                    onChange={(e) => setCustomReplacementValue(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950/60 border border-amber-500/40 rounded-lg text-sm font-bold text-amber-300 focus:ring-1 focus:ring-amber-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-amber-300/80 leading-tight">
                  Valor de reposição total das ferramentas caso o cliente extravie ou destrua.
                </p>
              </div>
            </div>

            {/* Special Conditions / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Condições Especiais / Observações de Uso
              </label>
              <textarea
                rows={2}
                value={specialConditions}
                onChange={(e) => setSpecialConditions(e.target.value)}
                placeholder="Ex: Utilizar somente óleo 2T na proporção correta; Não molhar o motor elétrico; Devolver limpo."
                className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Resumo Financeiro & Ações de Emissão */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl sticky top-20">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <span>Resumo Financeiro da Locação</span>
            </h3>

            {/* Financial Details */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Diária total das ferramentas:</span>
                <span className="font-semibold text-white">{formatCurrency(effectiveDailyRate)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Período contratado:</span>
                <span className="font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                  {rentalDays} {rentalDays === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-white/10">
                <span className="text-slate-400">Subtotal ({effectiveDailyRate} x {rentalDays}):</span>
                <span className="font-semibold text-white">{formatCurrency(baseRentalValue)}</span>
              </div>

              {/* Discount field */}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Desconto (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right glass-input rounded-lg font-semibold text-xs text-white"
                />
              </div>

              {/* Deposit / Caução */}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Caução / Garantia (R$):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositValue}
                  onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right glass-input rounded-lg font-semibold text-xs text-white"
                />
              </div>

              {/* Total Card */}
              <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-1 mt-3 backdrop-blur-md shadow-inner">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Valor Total a Pagar
                </span>
                <div className="text-2xl font-black text-amber-400">
                  {formatCurrency(totalRentalValue)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Vencimento: <strong className="text-white">{formatDateBR(expectedEndDate)}</strong>
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs font-semibold text-white focus:ring-1 focus:ring-amber-400"
                >
                  <option value="pix" className="bg-slate-900 text-white">PIX (Chave da Empresa)</option>
                  <option value="cartao_credito" className="bg-slate-900 text-white">Cartão de Crédito</option>
                  <option value="cartao_debito" className="bg-slate-900 text-white">Cartão de Débito</option>
                  <option value="dinheiro" className="bg-slate-900 text-white">Dinheiro em Espécie</option>
                  <option value="boleto" className="bg-slate-900 text-white">Boleto Bancário</option>
                  <option value="a_combinar" className="bg-slate-900 text-white">A Combinar / Faturado</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-98"
              >
                <FilePlus className="w-5 h-5" />
                <span>Gerar e Emitir Contrato</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Ao emitir, o contrato é salvo no histórico e fica pronto para impressão e envio no WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK CLIENT MODAL */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
            <div className="bg-slate-950/80 px-5 py-3.5 flex justify-between items-center border-b border-white/10">
              <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Cadastrar Novo Locatário Rápido
              </h3>
              <button
                onClick={() => setShowQuickClientModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddClientSubmit} className="p-5 space-y-3.5 text-xs text-slate-200">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="Ex: João da Silva Construções"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    value={quickClientDoc}
                    onChange={(e) => setQuickClientDoc(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    value={quickClientPhone}
                    onChange={(e) => setQuickClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Endereço da Obra / Residência</label>
                <input
                  type="text"
                  value={quickClientAddress}
                  onChange={(e) => setQuickClientAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Created Success Preview Modal */}
      {savedContractPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-transparent">
          <div className="relative w-full max-w-4xl bg-transparent my-auto">
            <div className="no-print bg-emerald-950/90 border border-emerald-500/40 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full border border-emerald-500/30" />
                <span className="font-bold text-sm text-emerald-200">
                  Contrato {savedContractPreview.contractNumber} emitido com sucesso!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSavedContractPreview(null);
                    onGoToHistory();
                  }}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-200"
                >
                  Ir para Histórico
                </button>
                <button
                  onClick={() => setSavedContractPreview(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>

            <ContractDocument contract={savedContractPreview} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
};
