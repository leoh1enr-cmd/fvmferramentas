import React, { useState, useEffect } from 'react';
import { RentalContract, ToolCondition } from '../types';
import { calculateDaysBetween, formatCurrency, formatDateBR, generateWhatsAppMessage, getTodayString, openWhatsApp } from '../utils/formatters';
import { CheckCircle2, AlertTriangle, ShieldAlert, X, MessageCircle, Printer, FileCheck } from 'lucide-react';

interface ReturnModalProps {
  contract: RentalContract | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReturn: (
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
  ) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  contract,
  isOpen,
  onClose,
  onConfirmReturn,
}) => {
  if (!isOpen || !contract) return null;

  const [returnedDate, setReturnedDate] = useState<string>(getTodayString());
  const [returnCondition, setReturnCondition] = useState<ToolCondition>('excelente');
  const [returnNotes, setReturnNotes] = useState<string>('Equipamento devolvido limpo e testado.');
  const [isExtraviado, setIsExtraviado] = useState<boolean>(false);
  const [extravioPaidAmount, setExtravioPaidAmount] = useState<number>(contract.totalReplacementValue);
  const [appliedLateFee, setAppliedLateFee] = useState<number>(0);
  const [lateDaysCount, setLateDaysCount] = useState<number>(0);
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState<boolean>(true);

  // Recalculate late days and fee when returnedDate changes
  useEffect(() => {
    const diff = calculateDaysBetween(contract.expectedEndDate, returnedDate);
    if (diff > 0) {
      setLateDaysCount(diff);
      const autoFee = diff * (contract.lateFeePerDay || 0);
      setAppliedLateFee(autoFee);
    } else {
      setLateDaysCount(0);
      setAppliedLateFee(0);
    }
  }, [returnedDate, contract.expectedEndDate, contract.lateFeePerDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = (contract.totalRentalValue || 0) + appliedLateFee + (isExtraviado ? extravioPaidAmount : 0);

    onConfirmReturn(contract.id, {
      returnedDate,
      returnCondition,
      returnNotes,
      calculatedLateDays: lateDaysCount,
      appliedLateFee,
      isExtraviado,
      extravioPaidAmount: isExtraviado ? extravioPaidAmount : 0,
      finalPaidAmount: finalAmount,
    });

    if (sendWhatsAppReceipt && (contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone)) {
      const msg = generateWhatsAppMessage('devolucao', contract);
      openWhatsApp(contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone, msg);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/15">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Devolução de Ferramentas</h3>
              <p className="text-xs text-slate-400">Contrato Nº: {contract.contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-200 text-sm">
          {/* Summary */}
          <div className="glass-panel-subtle p-3.5 rounded-xl border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Locatário:</span>
              <span className="font-bold text-white">{contract.clientSnapshot.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Equipamentos:</span>
              <span className="font-medium text-slate-200 text-right">
                {contract.tools.map(t => t.toolSnapshot.name).join(', ')}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
              <span className="text-slate-400">Data Prevista:</span>
              <span className="font-semibold text-amber-400">{formatDateBR(contract.expectedEndDate)}</span>
            </div>
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Data da Devolução Efetiva
            </label>
            <input
              type="date"
              value={returnedDate}
              onChange={(e) => setReturnedDate(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-xl font-medium text-sm text-white focus:ring-1 focus:ring-emerald-400"
              required
            />
          </div>

          {/* Late Days & Late Fee Calculation Box */}
          {lateDaysCount > 0 ? (
            <div className="glass-panel-subtle border border-rose-500/30 rounded-xl p-4 space-y-2 bg-rose-500/10">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Locação com Atraso Identificado ({lateDaysCount} {lateDaysCount === 1 ? 'dia' : 'dias'})</span>
              </div>
              <p className="text-xs text-rose-200">
                Data prevista: <strong>{formatDateBR(contract.expectedEndDate)}</strong> | Data devolução: <strong>{formatDateBR(returnedDate)}</strong>
              </p>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-rose-300 mb-1">
                  Multa por Atraso Calculada (R$ {contract.lateFeePerDay}/dia):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-medium text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={appliedLateFee}
                    onChange={(e) => setAppliedLateFee(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 glass-input rounded-xl text-sm font-bold text-rose-300 focus:ring-1 focus:ring-rose-400"
                  />
                </div>
                <span className="text-[11px] text-rose-400/80 mt-1 block">
                  Você pode isentar (R$ 0,00) ou ajustar o valor da multa conforme acordo com o cliente.
                </span>
              </div>
            </div>
          ) : (
            <div className="glass-panel-subtle border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center gap-2 bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Devolução no prazo contratual! Sem cobrança de multa por atraso.</span>
            </div>
          )}

          {/* Condition of Tool */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Estado de Conservação / Vistoria na Devolução
            </label>
            <select
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value as ToolCondition)}
              className="w-full px-3 py-2 glass-input rounded-xl text-xs font-medium text-slate-200 focus:ring-1 focus:ring-emerald-400"
            >
              <option value="excelente" className="bg-slate-900 text-slate-100">Excelente (Sem avarias, limpo e testado)</option>
              <option value="bom" className="bg-slate-900 text-slate-100">Bom (Marcas normais de uso na obra)</option>
              <option value="marcas_uso" className="bg-slate-900 text-slate-100">Marcas de uso acentuadas / Sujeira pesada</option>
              <option value="em_manutencao" className="bg-slate-900 text-slate-100">Com Defeito / Necessita de Manutenção</option>
            </select>
          </div>

          {/* Extravio or Total Loss Toggle */}
          <div className="border border-white/10 rounded-xl p-3.5 glass-panel-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="toggleExtravio" className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Houve Extravio, Furto ou Perda Total da Máquina?</span>
              </label>
              <input
                type="checkbox"
                id="toggleExtravio"
                checked={isExtraviado}
                onChange={(e) => setIsExtraviado(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded border-white/20 bg-white/5 focus:ring-rose-400 cursor-pointer"
              />
            </div>

            {isExtraviado && (
              <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                <p className="text-rose-300 font-medium">
                  Conforme Cláusula 3 do contrato, o cliente indeniza o valor de reposição da máquina.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Valor de Indenização por Extravio (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-medium text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={extravioPaidAmount}
                      onChange={(e) => setExtravioPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 glass-input rounded-xl text-sm font-bold text-rose-300 focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Observações / Checklist da Devolução
            </label>
            <input
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Ex: Acessórios conferidos, cabo elétrico íntegro."
              className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* WhatsApp Receipt checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="sendWhatsAppDev"
              checked={sendWhatsAppReceipt}
              onChange={(e) => setSendWhatsAppReceipt(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded border-white/20 bg-white/5 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="sendWhatsAppDev" className="text-xs font-medium text-slate-300 cursor-pointer flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              Enviar comprovante de devolução no WhatsApp do locatário
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar e Liberar Ferramenta(s)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
