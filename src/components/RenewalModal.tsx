import React, { useState } from 'react';
import { RentalContract } from '../types';
import { addDaysToDate, formatCurrency, formatDateBR, generateWhatsAppMessage, getTodayString, openWhatsApp } from '../utils/formatters';
import { CalendarPlus, MessageCircle, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RenewalModalProps {
  contract: RentalContract | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRenewal: (contractId: string, additionalDays: number, additionalValue: number, notes: string) => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  contract,
  isOpen,
  onClose,
  onConfirmRenewal,
}) => {
  if (!isOpen || !contract) return null;

  const [additionalDays, setAdditionalDays] = useState<number>(3);
  const [customValue, setCustomValue] = useState<number>(() => {
    return (contract.dailyRateTotal || 0) * 3;
  });
  const [notes, setNotes] = useState<string>('Renovação solicitada pelo cliente.');
  const [sendWhatsAppOnSuccess, setSendWhatsAppOnSuccess] = useState<boolean>(true);

  // Recalculate default additional value when days change
  const handleDaysChange = (days: number) => {
    const validDays = Math.max(1, days);
    setAdditionalDays(validDays);
    setCustomValue(validDays * (contract.dailyRateTotal || 0));
  };

  // Base date for renewal: if overdue, should renewal be from today or from expectedEndDate?
  // Usually in equipment rentals, renewal extends from current expectedEndDate, or from today if heavily overdue.
  const baseDate = contract.expectedEndDate;
  const newExpectedDate = addDaysToDate(baseDate, additionalDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmRenewal(contract.id, additionalDays, customValue, notes);
    
    if (sendWhatsAppOnSuccess && (contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone)) {
      // Create mock updated contract for message
      const updatedContract: RentalContract = {
        ...contract,
        expectedEndDate: newExpectedDate,
        rentalDays: contract.rentalDays + additionalDays,
        totalRentalValue: contract.totalRentalValue + customValue,
        renewals: [
          ...contract.renewals,
          {
            id: `ren-${Date.now()}`,
            date: getTodayString(),
            additionalDays,
            previousExpectedEndDate: contract.expectedEndDate,
            newExpectedEndDate: newExpectedDate,
            additionalValue: customValue,
            notes,
          }
        ]
      };
      const msg = generateWhatsAppMessage('renovacao', updatedContract);
      openWhatsApp(contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone, msg);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/15">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Renovar Prazo de Locação</h3>
              <p className="text-xs text-slate-400">Contrato: {contract.contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-200 text-sm">
          {/* Client & Equipment summary */}
          <div className="glass-panel-subtle p-3.5 rounded-xl border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Locatário:</span>
              <span className="font-bold text-white">{contract.clientSnapshot.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Equipamento(s):</span>
              <span className="font-medium text-slate-200 text-right">
                {contract.tools.map(t => t.toolSnapshot.name).join(', ')}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
              <span className="text-slate-400">Vencimento Atual:</span>
              <span className="font-bold text-amber-400">{formatDateBR(contract.expectedEndDate)}</span>
            </div>
          </div>

          {/* Additional Days Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Quantidade de Dias a Adicionar (Campo Aberto)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={additionalDays}
                onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
                className="w-28 px-3.5 py-2.5 glass-input rounded-xl text-lg font-black text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-center"
                required
              />
              <span className="text-sm font-medium text-slate-300">dias adicionais</span>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[1, 2, 3, 5, 7, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleDaysChange(days)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    additionalDays === days
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  +{days} {days === 1 ? 'dia' : 'dias'}
                </button>
              ))}
            </div>
          </div>

          {/* New End Date preview */}
          <div className="glass-panel-subtle border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs bg-amber-500/5">
            <div>
              <span className="text-amber-300 font-semibold block">Novo Prazo de Devolução:</span>
              <span className="text-xs text-slate-400">Calculado a partir de {formatDateBR(baseDate)}</span>
            </div>
            <span className="text-base font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl">
              {formatDateBR(newExpectedDate)}
            </span>
          </div>

          {/* Value for extension */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Valor Adicional da Renovação (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-xs">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customValue}
                onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-base font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Diária base das máquinas: {formatCurrency(contract.dailyRateTotal)} x {additionalDays} dias = {formatCurrency(additionalDays * (contract.dailyRateTotal || 0))}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Observações da Renovação
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente solicitou prorrogação para finalizar a pintura"
              className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Checkbox WhatsApp */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="sendWhatsAppRen"
              checked={sendWhatsAppOnSuccess}
              onChange={(e) => setSendWhatsAppOnSuccess(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded border-white/20 bg-white/5 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="sendWhatsAppRen" className="text-xs font-medium text-slate-300 cursor-pointer flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              Enviar confirmação de renovação direto no WhatsApp do cliente
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <RefreshCw className="w-4 h-4" />
              Confirmar Renovação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
