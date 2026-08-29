import React from 'react';
import { Client, CompanyProfile, RentalContract, Tool } from '../types';
import { calculateDaysBetween, formatCurrency, formatDateBR, formatDocument, formatPhone, generateWhatsAppMessage, getRentalDueStatus, getTodayString, openWhatsApp } from '../utils/formatters';
import { 
  FilePlus, 
  Wrench, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  RefreshCw, 
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  tools: Tool[];
  clients: Client[];
  contracts: RentalContract[];
  company: CompanyProfile;
  onNavigateTab: (tab: 'generator' | 'history' | 'reminders' | 'tools' | 'clients' | 'company') => void;
  onViewContract: (contract: RentalContract) => void;
  onOpenRenewalModal: (contract: RentalContract) => void;
  onOpenReturnModal: (contract: RentalContract) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tools,
  clients,
  contracts,
  company,
  onNavigateTab,
  onViewContract,
  onOpenRenewalModal,
  onOpenReturnModal,
}) => {
  const todayStr = getTodayString();

  // Metrics
  const activeContracts = contracts.filter(c => c.status !== 'devolvida' && c.status !== 'cancelada');
  const rentedToolsCount = tools.filter(t => t.status === 'locado').length;
  const availableToolsCount = tools.filter(t => t.status === 'disponivel').length;

  let overdueCount = 0;
  let dueTodayCount = 0;
  let totalOverdueFines = 0;

  const urgentContracts: { contract: RentalContract; lateDays: number; isOverdue: boolean; isDueToday: boolean }[] = [];

  activeContracts.forEach(c => {
    const diff = calculateDaysBetween(todayStr, c.expectedEndDate);
    if (diff < 0) {
      const lateDays = Math.abs(diff);
      overdueCount++;
      totalOverdueFines += lateDays * (c.lateFeePerDay || 0);
      urgentContracts.push({ contract: c, lateDays, isOverdue: true, isDueToday: false });
    } else if (diff === 0) {
      dueTodayCount++;
      urgentContracts.push({ contract: c, lateDays: 0, isOverdue: false, isDueToday: true });
    }
  });

  const totalRevenue = contracts
    .filter(c => c.status !== 'cancelada')
    .reduce((acc, c) => acc + (c.totalRentalValue || 0) + (c.appliedLateFee || 0), 0);

  const handleSendWhatsApp = (contract: RentalContract, type: 'lembrete_vencimento' | 'atraso') => {
    const phone = contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone;
    if (phone) {
      const msg = generateWhatsAppMessage(type, contract);
      openWhatsApp(phone, msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel text-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold backdrop-blur-xs">
              {company.tradeName || 'Locadora de Ferramentas'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Data: {formatDateBR(todayStr)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Controle de Ferramentas & Contratos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Emita contratos com quantidade livre de dias, valores de extravio e multas por atraso. Acompanhe renovações e devoluções com 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 z-10">
          <button
            onClick={() => onNavigateTab('generator')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98"
          >
            <FilePlus className="w-4 h-4" />
            <span>Emitir Novo Contrato</span>
          </button>

          <button
            onClick={() => onNavigateTab('reminders')}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors border border-white/10 backdrop-blur-md"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Ver Lembretes ({overdueCount + dueTodayCount})</span>
          </button>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Locadas */}
        <div 
          onClick={() => onNavigateTab('tools')}
          className="glass-panel p-4 sm:p-5 rounded-2xl hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Locadas / Em Uso</span>
            <div className="p-2 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{rentedToolsCount} <span className="text-xs text-slate-400 font-normal">/ {tools.length}</span></div>
          <p className="text-[11px] text-slate-400">{availableToolsCount} ferramentas disponíveis no estoque</p>
        </div>

        {/* Card 2: Em Atraso */}
        <div 
          onClick={() => onNavigateTab('reminders')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-2 group shadow-lg backdrop-blur-xl ${
            overdueCount > 0 
              ? 'bg-rose-950/40 border-rose-500/30 hover:border-rose-400/60' 
              : 'glass-panel hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${overdueCount > 0 ? 'text-rose-300' : 'text-slate-400'}`}>
              Locações em Atraso
            </span>
            <div className={`p-2 rounded-xl border group-hover:scale-110 transition-transform ${overdueCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${overdueCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {overdueCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {overdueCount > 0 ? `Multa acumulada: ${formatCurrency(totalOverdueFines)}` : 'Nenhum atraso registrado'}
          </p>
        </div>

        {/* Card 3: Vencendo Hoje */}
        <div 
          onClick={() => onNavigateTab('reminders')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-2 group shadow-lg backdrop-blur-xl ${
            dueTodayCount > 0
              ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400/70'
              : 'glass-panel hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${dueTodayCount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>Vencendo Hoje</span>
            <div className={`p-2 rounded-xl border group-hover:scale-110 transition-transform ${dueTodayCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${dueTodayCount > 0 ? 'text-amber-400' : 'text-white'}`}>{dueTodayCount}</div>
          <p className="text-[11px] text-slate-400">Contratos com previsão de devolução hoje</p>
        </div>

        {/* Card 4: Faturamento Total */}
        <div 
          onClick={() => onNavigateTab('history')}
          className="glass-panel p-4 sm:p-5 rounded-2xl hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total em Contratos</span>
            <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatCurrency(totalRevenue)}</div>
          <p className="text-[11px] text-slate-400">{contracts.length} contratos emitidos</p>
        </div>
      </div>

      {/* URGENT ALERTS SECTION (IF ANY OVERDUE OR DUE TODAY) */}
      {urgentContracts.length > 0 && (
        <div className="glass-panel rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden">
          <div className="bg-amber-500/10 px-5 py-3.5 border-b border-amber-500/20 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Atenção Necessária: Locações Vencidas ou Vencendo Hoje ({urgentContracts.length})</span>
            </div>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Ver todos os lembretes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/5 p-2">
            {urgentContracts.slice(0, 4).map(({ contract, lateDays, isOverdue }) => (
              <div
                key={contract.id}
                className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                      {contract.contractNumber}
                    </span>
                    {isOverdue ? (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/30">
                        {lateDays} {lateDays === 1 ? 'dia de atraso' : 'dias de atraso'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30">
                        Vence Hoje
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{contract.clientSnapshot.name}</h4>
                  <p className="text-xs text-slate-400">
                    Equipamentos: {contract.tools.map(t => t.toolSnapshot.name).join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSendWhatsApp(contract, isOverdue ? 'atraso' : 'lembrete_vencimento')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onOpenRenewalModal(contract)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Renovar</span>
                  </button>

                  <button
                    onClick={() => onOpenReturnModal(contract)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                    <span>Devolver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT CONTRACTS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Contracts Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Últimas Locações Emitidas
            </h3>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {contracts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Nenhum contrato cadastrado ainda.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {contracts.slice(0, 5).map(contract => {
                const dueStatus = getRentalDueStatus(contract.expectedEndDate, contract.status);

                return (
                  <div key={contract.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-white/[0.02] rounded-xl px-2 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{contract.contractNumber}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border backdrop-blur-xs ${
                          dueStatus.isOverdue 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                            : dueStatus.isDueToday 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : contract.status === 'devolvida'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {dueStatus.label}
                        </span>
                      </div>
                      <p className="font-bold text-white mt-0.5">{contract.clientSnapshot.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {contract.tools.map(t => t.toolSnapshot.name).join(', ')} • Prazo: {contract.rentalDays} dias ({formatDateBR(contract.expectedEndDate)})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="block text-white font-black text-sm">{formatCurrency(contract.totalRentalValue)}</strong>
                      <button
                        onClick={() => onViewContract(contract)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-semibold"
                      >
                        Ver Contrato
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Tool Availability Summary */}
        <div className="glass-panel rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Resumo do Inventário
            </h3>
            <button
              onClick={() => onNavigateTab('tools')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Gerenciar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-3 glass-panel-subtle rounded-xl border border-emerald-500/20">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Ferramentas Disponíveis
              </span>
              <strong className="text-emerald-300 text-sm font-black">{availableToolsCount}</strong>
            </div>

            <div className="flex justify-between items-center text-xs p-3 glass-panel-subtle rounded-xl border border-amber-500/20">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Ferramentas Locadas
              </span>
              <strong className="text-amber-300 text-sm font-black">{rentedToolsCount}</strong>
            </div>

            <div className="flex justify-between items-center text-xs p-3 glass-panel-subtle rounded-xl border border-white/10">
              <span className="font-semibold text-slate-300">👥 Locatários Cadastrados</span>
              <strong className="text-white text-sm font-black">{clients.length}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => onNavigateTab('generator')}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98"
            >
              <FilePlus className="w-4 h-4" />
              <span>Nova Locação / Contrato</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
