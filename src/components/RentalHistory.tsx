import React, { useState, useMemo } from 'react';
import { RentalContract } from '../types';
import { 
  calculateDaysBetween, 
  formatCurrency, 
  formatDateBR, 
  formatDocument, 
  formatPhone, 
  getRentalDueStatus, 
  getTodayString, 
  generateWhatsAppMessage, 
  openWhatsApp 
} from '../utils/formatters';
import { 
  Search, 
  Filter, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  MessageCircle, 
  Trash2, 
  Calendar, 
  Eye, 
  Wrench, 
  Users, 
  X, 
  ArrowUpDown,
  RotateCcw,
  Clock,
  Download
} from 'lucide-react';

interface RentalHistoryProps {
  contracts: RentalContract[];
  onViewContract: (contract: RentalContract) => void;
  onOpenRenewalModal: (contract: RentalContract) => void;
  onOpenReturnModal: (contract: RentalContract) => void;
  onDeleteContract: (contractId: string) => void;
  onNewRental: () => void;
}

type PeriodPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'next_7_days' | 'overdue' | 'custom';
type SortOption = 'date_desc' | 'date_asc' | 'due_asc' | 'value_desc';

export const RentalHistory: React.FC<RentalHistoryProps> = ({
  contracts,
  onViewContract,
  onOpenRenewalModal,
  onOpenReturnModal,
  onDeleteContract,
  onNewRental,
}) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativa' | 'vencendo' | 'vencida' | 'devolvida'>('all');
  const [selectedToolId, setSelectedToolId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [dateFieldType, setDateFieldType] = useState<'startDate' | 'expectedEndDate'>('startDate');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const todayStr = getTodayString();

  // Extract unique tools and clients for the dropdown filters
  const uniqueTools = useMemo(() => {
    const map = new Map<string, { id: string; name: string; brand: string }>();
    contracts.forEach(c => {
      c.tools.forEach(t => {
        if (!map.has(t.toolId)) {
          map.set(t.toolId, {
            id: t.toolId,
            name: t.toolSnapshot.name,
            brand: t.toolSnapshot.brand,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    contracts.forEach(c => {
      if (!map.has(c.clientId)) {
        map.set(c.clientId, {
          id: c.clientId,
          name: c.clientSnapshot.name,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  // Handle preset change
  const handlePresetChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === 'today') {
      setStartDateFilter(todayStr);
      setEndDateFilter(todayStr);
    } else if (preset === 'this_week') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDateFilter(past7.toISOString().split('T')[0]);
      setEndDateFilter(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDateFilter(firstDay.toISOString().split('T')[0]);
      setEndDateFilter(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'next_7_days') {
      const next7 = new Date();
      next7.setDate(now.getDate() + 7);
      setStartDateFilter(todayStr);
      setEndDateFilter(next7.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDateFilter('');
      setEndDateFilter('');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedToolId('all');
    setSelectedClientId('all');
    setPeriodPreset('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setSortBy('date_desc');
  };

  const hasActiveFilters = 
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    selectedToolId !== 'all' ||
    selectedClientId !== 'all' ||
    periodPreset !== 'all' ||
    startDateFilter !== '' ||
    endDateFilter !== '';

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let result = contracts.filter(contract => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const dueStatus = getRentalDueStatus(contract.expectedEndDate, contract.status);
        if (statusFilter === 'ativa' && contract.status !== 'ativa' && contract.status !== 'renovada') return false;
        if (statusFilter === 'vencida' && !dueStatus.isOverdue) return false;
        if (statusFilter === 'vencendo' && !dueStatus.isDueToday && !dueStatus.isDueTomorrow) return false;
        if (statusFilter === 'devolvida' && contract.status !== 'devolvida') return false;
      }

      // 2. Specific Tool Filter
      if (selectedToolId !== 'all') {
        const hasTool = contract.tools.some(t => t.toolId === selectedToolId);
        if (!hasTool) return false;
      }

      // 3. Specific Client / Locador Filter
      if (selectedClientId !== 'all') {
        if (contract.clientId !== selectedClientId) return false;
      }

      // 4. Period / Date Range Filter
      if (periodPreset === 'overdue') {
        const diff = calculateDaysBetween(todayStr, contract.expectedEndDate);
        if (contract.status === 'devolvida' || diff >= 0) return false;
      } else if (startDateFilter || endDateFilter) {
        const targetDate = dateFieldType === 'startDate' ? contract.startDate : contract.expectedEndDate;
        if (startDateFilter && targetDate < startDateFilter) return false;
        if (endDateFilter && targetDate > endDateFilter) return false;
      }

      // 5. Text Search Filter (Tool name, Brand, Model, Serial, Client name, Document, Contract Number, Phone)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNumber = contract.contractNumber.toLowerCase().includes(term);
        const matchClient = contract.clientSnapshot.name.toLowerCase().includes(term) ||
          (contract.clientSnapshot.documentNumber && contract.clientSnapshot.documentNumber.includes(term)) ||
          (contract.clientSnapshot.phone && contract.clientSnapshot.phone.includes(term)) ||
          (contract.clientSnapshot.whatsapp && contract.clientSnapshot.whatsapp.includes(term));
        
        const matchTools = contract.tools.some(t => 
          t.toolSnapshot.name.toLowerCase().includes(term) ||
          t.toolSnapshot.brand.toLowerCase().includes(term) ||
          t.toolSnapshot.model.toLowerCase().includes(term) ||
          (t.toolSnapshot.serialNumber && t.toolSnapshot.serialNumber.toLowerCase().includes(term))
        );

        return matchNumber || matchClient || matchTools;
      }

      return true;
    });

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.startDate.localeCompare(a.startDate);
      }
      if (sortBy === 'date_asc') {
        return a.startDate.localeCompare(b.startDate);
      }
      if (sortBy === 'due_asc') {
        return a.expectedEndDate.localeCompare(b.expectedEndDate);
      }
      if (sortBy === 'value_desc') {
        return (b.totalRentalValue || 0) - (a.totalRentalValue || 0);
      }
      return 0;
    });
  }, [
    contracts,
    searchTerm,
    statusFilter,
    selectedToolId,
    selectedClientId,
    periodPreset,
    dateFieldType,
    startDateFilter,
    endDateFilter,
    sortBy,
    todayStr,
  ]);

  const totalFilteredValue = useMemo(() => {
    return filteredContracts.reduce((sum, c) => sum + (c.totalRentalValue || 0), 0);
  }, [filteredContracts]);

  const handleSendWhatsApp = (contract: RentalContract) => {
    const phone = contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone;
    if (!phone) return;

    const dueStatus = getRentalDueStatus(contract.expectedEndDate, contract.status);
    let type: 'lembrete_vencimento' | 'atraso' | 'novo_contrato' = 'novo_contrato';

    if (dueStatus.isOverdue) {
      type = 'atraso';
    } else if (dueStatus.isDueToday || dueStatus.isDueTomorrow) {
      type = 'lembrete_vencimento';
    }

    const msg = generateWhatsAppMessage(type, contract);
    openWhatsApp(phone, msg);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
                <FileText className="w-5 h-5" />
              </span>
              Histórico & Busca de Locações
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pesquise ferramentas, locatários e filtre contratos por período, data de devolução ou status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros Avançados</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={onNewRental}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <span>+ Nova Locação</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Status Tabs */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Main Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome da ferramenta, locador/cliente, CPF/CNPJ ou nº do contrato..."
                className="w-full pl-9 pr-9 py-2.5 glass-input rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-400 text-slate-100 placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-8 pr-4 py-2.5 glass-input rounded-xl text-xs font-semibold text-slate-200"
                >
                  <option value="date_desc" className="bg-slate-900 text-slate-100">Mais Recentes</option>
                  <option value="date_asc" className="bg-slate-900 text-slate-100">Mais Antigos</option>
                  <option value="due_asc" className="bg-slate-900 text-slate-100">Vencimento Próximo</option>
                  <option value="value_desc" className="bg-slate-900 text-slate-100">Maior Valor (R$)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'all'
                  ? 'bg-white/20 text-white border-white/30 shadow-md backdrop-blur-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              Todas ({contracts.length})
            </button>

            <button
              onClick={() => setStatusFilter('ativa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'ativa'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              Em Andamento
            </button>

            <button
              onClick={() => setStatusFilter('vencendo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'vencendo'
                  ? 'bg-blue-500/30 text-blue-300 border-blue-500/40 shadow-md backdrop-blur-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              Vencendo Hoje/Breve
            </button>

            <button
              onClick={() => setStatusFilter('vencida')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'vencida'
                  ? 'bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-md backdrop-blur-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              Em Atraso
            </button>

            <button
              onClick={() => setStatusFilter('devolvida')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'devolvida'
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-md backdrop-blur-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              Devolvidas
            </button>
          </div>
        </div>

        {/* ADVANCED FILTERS PANEL: Tool, Client, Period & Date Ranges */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Tool Filter */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Filtrar por Ferramenta</span>
              </label>
              <select
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
              >
                <option value="all" className="bg-slate-900 text-slate-100">Todas as Ferramentas</option>
                {uniqueTools.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.name} ({t.brand})
                  </option>
                ))}
              </select>
            </div>

            {/* Client / Locador Filter */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Filtrar por Locatário / Locador</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
              >
                <option value="all" className="bg-slate-900 text-slate-100">Todos os Locatários</option>
                {uniqueClients.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Preset */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Período da Locação</span>
              </label>
              <select
                value={periodPreset}
                onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
              >
                <option value="all" className="bg-slate-900 text-slate-100">Todos os Períodos</option>
                <option value="today" className="bg-slate-900 text-slate-100">Hoje</option>
                <option value="this_week" className="bg-slate-900 text-slate-100">Esta Semana (Últimos 7 dias)</option>
                <option value="this_month" className="bg-slate-900 text-slate-100">Este Mês</option>
                <option value="next_7_days" className="bg-slate-900 text-slate-100">Próximos 7 Dias (Previsão)</option>
                <option value="overdue" className="bg-slate-900 text-slate-100">Somente Vencidos</option>
                <option value="custom" className="bg-slate-900 text-slate-100">Personalizado...</option>
              </select>
            </div>

            {/* Date Type Selector (Start vs Due Date) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Aplicar Período Em</span>
              </label>
              <select
                value={dateFieldType}
                onChange={(e) => setDateFieldType(e.target.value as any)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
              >
                <option value="startDate" className="bg-slate-900 text-slate-100">Data de Emissão (Início)</option>
                <option value="expectedEndDate" className="bg-slate-900 text-slate-100">Data de Devolução Prevista</option>
              </select>
            </div>

            {/* Custom Date Pickers (Shown if dates are set or custom selected) */}
            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 pt-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-bold text-slate-300 text-xs">Intervalo de Datas:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">De:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="px-2.5 py-1.5 glass-input rounded-lg text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Até:</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="px-2.5 py-1.5 glass-input rounded-lg text-xs text-slate-200"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold transition-colors border border-rose-500/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar Todos os Filtros</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Counter and Active Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span>
              Exibindo <strong className="text-white font-bold">{filteredContracts.length}</strong> de <strong className="text-slate-400">{contracts.length}</strong> contratos
            </span>
            <span>•</span>
            <span>
              Faturamento filtrado: <strong className="text-emerald-400 font-bold">{formatCurrency(totalFilteredValue)}</strong>
            </span>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-slate-200 rounded-md text-[11px] border border-white/10">
                  Busca: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[11px] border border-amber-500/30">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedToolId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-slate-200 rounded-md text-[11px] border border-white/10">
                  Ferramenta selecionada
                  <button onClick={() => setSelectedToolId('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedClientId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-slate-200 rounded-md text-[11px] border border-white/10">
                  Locatário selecionado
                  <button onClick={() => setSelectedClientId('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(startDateFilter || endDateFilter) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md text-[11px] border border-blue-500/30">
                  Período: {startDateFilter ? formatDateBR(startDateFilter) : 'Início'} até {endDateFilter ? formatDateBR(endDateFilter) : 'Fim'}
                  <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); setPeriodPreset('all'); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma locação encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Não encontramos nenhum contrato correspondente aos filtros e termos de pesquisa aplicados.'
              : 'Você ainda não possui locações registradas. Clique abaixo para emitir o primeiro contrato.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all"
            >
              Limpar Filtros de Busca
            </button>
          ) : (
            <button
              onClick={onNewRental}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Emitir Novo Contrato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContracts.map(contract => {
            const dueStatus = getRentalDueStatus(contract.expectedEndDate, contract.status);
            const isCompleted = contract.status === 'devolvida';

            return (
              <div
                key={contract.id}
                className="glass-panel rounded-2xl p-5 shadow-2xl hover:border-amber-500/30 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                      {contract.contractNumber}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-xs ${
                      dueStatus.isOverdue 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : dueStatus.isDueToday 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {dueStatus.label}
                    </span>

                    {contract.renewals && contract.renewals.length > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg">
                        Renovado ({contract.renewals.length}x)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Início: <strong className="text-slate-200">{formatDateBR(contract.startDate)}</strong></span>
                    <span>•</span>
                    <span>Prazo: <strong className="text-slate-200">{contract.rentalDays} dias</strong></span>
                    <span>•</span>
                    <span>Previsão: <strong className="text-amber-300">{formatDateBR(contract.expectedEndDate)}</strong></span>
                  </div>
                </div>

                {/* Content Row: Client & Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Client info */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Locatário (Cliente)
                    </span>
                    <h4 className="font-bold text-white text-sm leading-tight">
                      {contract.clientSnapshot.name}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {contract.clientSnapshot.documentType}: {formatDocument(contract.clientSnapshot.documentNumber)}
                    </p>
                    <p className="text-amber-400 font-mono text-[11px]">
                      {formatPhone(contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone)}
                    </p>
                  </div>

                  {/* Tool info */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Ferramentas Locadas ({contract.tools.length})
                    </span>
                    <div className="space-y-1.5">
                      {contract.tools.map((t, idx) => (
                        <div key={idx} className="font-medium text-slate-200">
                          <span className="font-semibold text-white">{t.toolSnapshot.name}</span>
                          <span className="text-slate-400 text-[11px] block">
                            {t.toolSnapshot.brand} {t.toolSnapshot.model} {t.toolSnapshot.serialNumber ? `• S/N: ${t.toolSnapshot.serialNumber}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Penalty terms */}
                  <div className="glass-panel-subtle p-3.5 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Valor da Locação:</span>
                      <strong className="text-white text-sm font-black">{formatCurrency(contract.totalRentalValue)}</strong>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-rose-300">
                      <span>Multa por atraso:</span>
                      <strong>{formatCurrency(contract.lateFeePerDay)}/dia</strong>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-amber-300">
                      <span>Valor em caso de extravio:</span>
                      <strong>{formatCurrency(contract.totalReplacementValue)}</strong>
                    </div>

                    {isCompleted && (
                      <div className="pt-1.5 border-t border-white/10 text-emerald-300 font-bold text-[11px]">
                        Devolvido em: {formatDateBR(contract.returnedDate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewContract(contract)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Contrato / Imprimir</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(contract)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                      title="Enviar lembrete ou cobrança pelo WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => onOpenRenewalModal(contract)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Renovar (+Dias)</span>
                        </button>

                        <button
                          onClick={() => onOpenReturnModal(contract)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Registrar Devolução</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja realmente remover o contrato ${contract.contractNumber}?`)) {
                          onDeleteContract(contract.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Excluir contrato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
