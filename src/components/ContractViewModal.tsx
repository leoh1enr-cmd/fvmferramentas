import React from 'react';
import { RentalContract } from '../types';
import { ContractDocument } from './ContractDocument';
import { X, Printer, MessageCircle } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../utils/formatters';

interface ContractViewModalProps {
  contract: RentalContract | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractViewModal: React.FC<ContractViewModalProps> = ({
  contract,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = contract.clientSnapshot.whatsapp || contract.clientSnapshot.phone;
    if (phone) {
      const msg = generateWhatsAppMessage('novo_contrato', contract);
      openWhatsApp(phone, msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 print:p-0 print:bg-transparent">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-transparent my-auto">
        {/* Close Button on top right */}
        <div className="no-print flex justify-end gap-2.5 mb-3">
          <button
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-98"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all shadow-md active:scale-98 border border-white/10"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contract Sheet */}
        <ContractDocument contract={contract} onPrint={handlePrint} showActions={true} />
      </div>
    </div>
  );
};
