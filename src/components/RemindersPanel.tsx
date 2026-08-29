import React, { useState, useEffect } from 'react';
import { PushNotificationRecord, RentalContract } from '../types';
import { 
  calculateDaysBetween, 
  formatCurrency, 
  formatDateBR, 
  formatDocument, 
  formatPhone, 
  generateWhatsAppMessage, 
  getRentalDueStatus, 
  getTodayString, 
  openWhatsApp 
} from '../utils/formatters';
import { 
  checkAndSendRentalNotifications, 
  clearNotificationHistory, 
  getNotificationHistory, 
  getNotificationPermission, 
  isNotificationSupported, 
  playNotificationChime, 
  requestNotificationPermission, 
  sendTestNotification 
} from '../utils/notifications';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  MessageCircle, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  FileText,
  ShieldAlert,
  Sparkles,
  Volume2,
  Check,
  XCircle,
  History,
  Trash2,
  Zap,
  Info
} from 'lucide-react';

interface RemindersPanelProps {
  contracts: RentalContract[];
  onOpenRenewalModal: (contract: RentalContract) => void;
  onOpenReturnModal: (contract: RentalContract) => void;
  onViewContract: (contract: RentalContract) => void;
}

export const RemindersPanel: React.FC<RemindersPanelProps> = ({
  contracts,
  onOpenRenewalModal,
  onOpenReturnModal,
  onViewContract,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notificationLogs, setNotificationLogs] = useState<PushNotificationRecord[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  const [justNotifiedCount, setJustNotifiedCount] = useState<number | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
    setNotificationLogs(getNotificationHistory());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      const res = checkAndSendRentalNotifications(contracts);
      setNotificationLogs(getNotificationHistory());
      setJustNotifiedCount(res.sentCount);
      setTimeout(() => setJustNotifiedCount(null), 4000);
    }
  };

  const handleRunManualCheck = () => {
    const res = checkAndSendRentalNotifications(contracts);
    setNotificationLogs(getNotificationHistory());
    setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
    setJustNotifiedCount(res.sentCount);
    setTimeout(() => setJustNotifiedCount(null), 4000);
  };

  const handleTestNotification = () => {
    const testRecord = sendTestNotification();
    setNotificationLogs(getNotificationHistory());
    setJustNotifiedCount(1);
    setTimeout(() => setJustNotifiedCount(null), 4000);
  };

  const handleClearLogs = () => {
    if (window.confirm('Deseja limpar o histórico de notificações registradas?')) {
      clearNotificationHistory();
      setNotificationLogs([]);
    }
  };

  // Active (not returned) contracts
  const activeContracts = contracts.filter(c => c.status !== 'devolvida' && c.status !== 'cancelada');

  const overdueList: { contract: RentalContract; lateDays: number; estimatedFee: number }[] = [];
  const dueTodayList: RentalContract[] = [];
  const dueInFiveDaysList: RentalContract[] = [];
  const dueSoonOtherList: { contract: RentalContract; daysLeft: number }[] = [];

  const todayStr = getTodayString();

  activeContracts.forEach(contract => {
    const diff = calculateDaysBetween(todayStr, contract.expectedEndDate);
    if (diff < 0) {
      const lateDays = Math.abs(diff);
      const estimatedFee = lateDays * (contract.lateFeePerDay || 0);
      overdueList.push({ contract, lateDays, estimatedFee });
    } else if (diff === 0) {
      dueTodayList.push(contract);
    } else if (diff === 5) {
      dueInFiveDaysList.push(contract);
    } else if (diff > 0 && diff <= 4) {
      dueSoonOtherList.push({ contract, daysLeft: diff });
    }
  });

  const handleSendWhatsApp = (contract: RentalContract, type: 'lembrete_vencimento' | 'atraso') => {
    const phone = contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone;
    if (phone) {
      const msg = generateWhatsAppMessage(type, contract);
      openWhatsApp(phone, msg);
    }
  };

  const totalAlerts = overdueList.length + dueTodayList.length + dueInFiveDaysList.length + dueSoonOtherList.length;

  return (
    <div className="space-y-6">
      {/* Push Notification System Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl shadow-2xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <BellRing className="w-6 h-6 animate-bounce" />
              </span>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  Sistema de Notificações Push & Lembretes
                </h1>
                <p className="text-xs text-amber-300 font-semibold">
                  FVM Ferramentas • Floresta Verde Madeiras
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              O sistema envia alertas automáticos no navegador e avisos sonoros 
              <strong className="text-white"> 5 dias antes do prazo</strong> e 
              <strong className="text-white"> no dia do vencimento</strong> para todas as locações em andamento não devolvidas.
            </p>
          </div>

          {/* Action buttons & Status Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400">Push no Navegador:</span>
              {permission === 'granted' ? (
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Ativo
                </span>
              ) : permission === 'denied' ? (
                <span className="flex items-center gap-1 font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Bloqueado
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-amber-400">
                  Pendente
                </span>
              )}
            </div>

            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 active:scale-98"
              >
                <Bell className="w-4 h-4" />
                <span>Ativar Notificações Push</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestNotification}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all active:scale-98"
                  title="Disparar notificação e som de teste"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testar Alerta</span>
                </button>

                <button
                  onClick={handleRunManualCheck}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all active:scale-98"
                  title="Verificar todos os contratos agora"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verificar Agora</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback message if notifications just checked/sent */}
        {justNotifiedCount !== null && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {justNotifiedCount > 0 
                ? `${justNotifiedCount} nova(s) notificação(ões) push disparada(s) com sucesso!`
                : 'Verificação concluída. Todas as notificações para os contratos de hoje já foram enviadas.'}
            </span>
            <span className="text-[11px] text-emerald-400/80">Checado às {lastCheckTime}</span>
          </div>
        )}

        {/* Info Rules pills */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
            <div>
              <strong className="text-blue-300 block">Lembrete de 5 Dias Antes</strong>
              <p className="text-slate-400 text-[11px]">Notifica o usuário com 5 dias de antecedência para planejar a renovação ou devolução.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <div>
              <strong className="text-amber-300 block">Lembrete no Dia do Vencimento</strong>
              <p className="text-slate-400 text-[11px]">Dispara no dia previsto da entrega caso o equipamento ainda não tenha retornado.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
            <div>
              <strong className="text-rose-300 block">Alerta Contínuo de Atraso</strong>
              <p className="text-slate-400 text-[11px]">Calcula multas diárias contratuais e disponibiliza cobrança com um clique no WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT SECTIONS */}
      {totalAlerts === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum alerta pendente no momento!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Todas as ferramentas locadas estão dentro do prazo normal. O sistema notificará você automaticamente 5 dias antes de cada devolução e no dia do vencimento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. SEÇÃO EM ATRASO (CRÍTICO) */}
          {overdueList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-rose-500/40 shadow-2xl overflow-hidden">
              <div className="bg-rose-950/40 px-5 py-3.5 border-b border-rose-500/30 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Locações em Atraso ({overdueList.length})</span>
                </div>
                <span className="text-xs font-semibold text-rose-400">Cobrança e Multas Diárias</span>
              </div>

              <div className="divide-y divide-white/5 p-2">
                {overdueList.map(({ contract, lateDays, estimatedFee }) => (
                  <div key={contract.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                          {contract.contractNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/30">
                          {lateDays} {lateDays === 1 ? 'dia de atraso' : 'dias de atraso'}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{contract.clientSnapshot.name}</h4>
                      <p className="text-xs text-slate-400">
                        Ferramentas: <strong className="text-slate-200">{contract.tools.map(t => t.toolSnapshot.name).join(', ')}</strong>
                      </p>
                      <p className="text-xs text-rose-300">
                        Venceu em: <strong>{formatDateBR(contract.expectedEndDate)}</strong> • Multa acumulada estimada: <strong>{formatCurrency(estimatedFee)}</strong> ({formatCurrency(contract.lateFeePerDay)}/dia)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendWhatsApp(contract, 'atraso')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Cobrar no WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onOpenRenewalModal(contract)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Renovar Prazo</span>
                      </button>

                      <button
                        onClick={() => onOpenReturnModal(contract)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Devolver</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. SEÇÃO VENCENDO HOJE (REGRA: DIA DO VENCIMENTO) */}
          {dueTodayList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden">
              <div className="bg-amber-950/40 px-5 py-3.5 border-b border-amber-500/30 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Locações Vencendo Hoje ({dueTodayList.length})</span>
                </div>
                <span className="text-xs font-semibold text-amber-400">Notificação Automática Disparada</span>
              </div>

              <div className="divide-y divide-white/5 p-2">
                {dueTodayList.map(contract => (
                  <div key={contract.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                          {contract.contractNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30">
                          Vence Hoje ({formatDateBR(contract.expectedEndDate)})
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{contract.clientSnapshot.name}</h4>
                      <p className="text-xs text-slate-400">
                        Ferramentas: <strong className="text-slate-200">{contract.tools.map(t => t.toolSnapshot.name).join(', ')}</strong>
                      </p>
                      <p className="text-xs text-amber-400/90">
                        Contato: {formatPhone(contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendWhatsApp(contract, 'lembrete_vencimento')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Lembrar no WhatsApp</span>
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
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Devolver</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SEÇÃO VENCENDO EM EXATAMENTE 5 DIAS (REGRA: 5 DIAS ANTES) */}
          {dueInFiveDaysList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-blue-500/40 shadow-2xl overflow-hidden">
              <div className="bg-blue-950/40 px-5 py-3.5 border-b border-blue-500/30 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Lembrete de 5 Dias Antes da Devolução ({dueInFiveDaysList.length})</span>
                </div>
                <span className="text-xs font-semibold text-blue-400">Notificação Preventiva Ativa</span>
              </div>

              <div className="divide-y divide-white/5 p-2">
                {dueInFiveDaysList.map(contract => (
                  <div key={contract.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                          {contract.contractNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold text-xs rounded-lg border border-blue-500/30">
                          Vence em 5 dias ({formatDateBR(contract.expectedEndDate)})
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{contract.clientSnapshot.name}</h4>
                      <p className="text-xs text-slate-400">
                        Ferramentas: <strong className="text-slate-200">{contract.tools.map(t => t.toolSnapshot.name).join(', ')}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendWhatsApp(contract, 'lembrete_vencimento')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Avisar no WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onOpenRenewalModal(contract)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Renovar</span>
                      </button>

                      <button
                        onClick={() => onViewContract(contract)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Contrato</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. OUTROS VENCIMENTOS PRÓXIMOS (1 A 4 DIAS) */}
          {dueSoonOtherList.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="bg-white/5 px-5 py-3.5 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Outras Locações Próximas do Vencimento ({dueSoonOtherList.length})</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">Em Acompanhamento</span>
              </div>

              <div className="divide-y divide-white/5 p-2">
                {dueSoonOtherList.map(({ contract, daysLeft }) => (
                  <div key={contract.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                          {contract.contractNumber}
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-slate-300 font-bold text-xs rounded-lg border border-white/10">
                          Vence em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} ({formatDateBR(contract.expectedEndDate)})
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{contract.clientSnapshot.name}</h4>
                      <p className="text-xs text-slate-400">
                        Ferramentas: <strong className="text-slate-200">{contract.tools.map(t => t.toolSnapshot.name).join(', ')}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendWhatsApp(contract, 'lembrete_vencimento')}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATION LOG HISTORY */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Histórico de Notificações Push Disparadas</h3>
          </div>

          {notificationLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Registros</span>
            </button>
          )}
        </div>

        {notificationLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Nenhuma notificação push foi disparada recentemente. Quando um lembrete automático for acionado, ele ficará registrado aqui.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {notificationLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                      log.type === '5_days_before'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : log.type === 'due_today'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : log.type === 'overdue'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}>
                      {log.type === '5_days_before' ? '5 Dias Antes' : log.type === 'due_today' ? 'Vence Hoje' : log.type === 'overdue' ? 'Em Atraso' : 'Teste'}
                    </span>
                    <strong className="text-white text-xs">{log.title}</strong>
                  </div>
                  <p className="text-slate-300 text-[11px]">{log.body}</p>
                </div>

                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.sentAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
