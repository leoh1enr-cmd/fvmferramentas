import React from 'react';
import { RentalContract } from '../types';
import { formatCEP, formatCNPJ, formatCurrency, formatDateBR, formatDocument, formatPhone, getPowerTypeLabel } from '../utils/formatters';
import { Printer, Share2, MessageCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { generateWhatsAppMessage, openWhatsApp } from '../utils/formatters';

interface ContractDocumentProps {
  contract: RentalContract;
  onPrint?: () => void;
  showActions?: boolean;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contract,
  onPrint,
  showActions = true,
}) => {
  const { companySnapshot: company, clientSnapshot: client, tools } = contract;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleSendWhatsApp = () => {
    if (client.whatsapp || client.phone) {
      const msg = generateWhatsAppMessage('novo_contrato', contract);
      openWhatsApp(client.whatsapp || client.phone, msg);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden print-contract print:shadow-none print:border-none print:rounded-none">
      {/* Top Action Bar for web screen */}
      {showActions && (
        <div className="no-print bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Contrato de Locação</span>
              <h2 className="text-lg font-black text-white leading-tight">Nº {contract.contractNumber}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-98"
              title="Enviar resumo do contrato via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Contract Printable Area */}
      <div className="p-8 sm:p-12 text-slate-900 text-sm leading-relaxed space-y-6 print:p-0">
        {/* Header: Company and Contract Info */}
        <div className="border-b-2 border-slate-900 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                {company.tradeName || company.legalName}
              </h1>
              <p className="text-xs font-semibold text-slate-600">{company.legalName}</p>
              <p className="text-xs text-slate-500 mt-1">
                CNPJ/CPF: {formatDocument(company.cnpjCpf)} | Tel/WhatsApp: {formatPhone(company.whatsapp || company.phone)}
              </p>
              <p className="text-xs text-slate-500">
                {company.address.street}, Nº {company.address.number} {company.address.complement ? ` - ${company.address.complement}` : ''} - {company.address.neighborhood}, {company.address.city}/{company.address.state} - CEP: {formatCEP(company.address.zipCode)}
              </p>
            </div>

            <div className="text-right sm:border-l-2 sm:border-slate-300 sm:pl-6">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded">
                CONTRATO Nº {contract.contractNumber}
              </span>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Data de Emissão: <strong>{formatDateBR(contract.startDate)}</strong>
              </p>
              {contract.status === 'vencida' && (
                <span className="no-print inline-block mt-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded">
                  Status: Em Atraso
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
              INSTRUMENTO PARTICULAR DE LOCAÇÃO DE EQUIPAMENTOS E FERRAMENTAS
            </h2>
          </div>
        </div>

        {/* 1. DAS PARTES */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            1. QUALIFICAÇÃO DAS PARTES
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Locadora */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-slate-950 font-bold mb-1 text-[11px] uppercase tracking-wide">
                LOCADORA (EMISSORA):
              </strong>
              <p><span className="text-slate-600">Razão Social:</span> <strong>{company.legalName}</strong></p>
              <p><span className="text-slate-600">Nome Fantasia:</span> {company.tradeName || '-'}</p>
              <p><span className="text-slate-600">CNPJ/CPF:</span> {formatDocument(company.cnpjCpf)}</p>
              <p><span className="text-slate-600">Telefone/WhatsApp:</span> {formatPhone(company.whatsapp || company.phone)}</p>
              <p><span className="text-slate-600">Endereço:</span> {company.address.street}, {company.address.number}, {company.address.city}/{company.address.state}</p>
              {company.pixKey && (
                <p className="mt-1 text-slate-800 font-mono text-[11px]">
                  <strong>Chave PIX:</strong> {company.pixKey} ({company.pixKeyType})
                </p>
              )}
            </div>

            {/* Locatário */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="block text-slate-950 font-bold mb-1 text-[11px] uppercase tracking-wide">
                LOCATÁRIO(A) (CLIENTE):
              </strong>
              <p><span className="text-slate-600">Nome / Razão Social:</span> <strong>{client.name}</strong></p>
              <p><span className="text-slate-600">{client.documentType}:</span> <strong>{formatDocument(client.documentNumber)}</strong></p>
              {client.rgIe && <p><span className="text-slate-600">RG/IE:</span> {client.rgIe}</p>}
              <p><span className="text-slate-600">Telefone / WhatsApp:</span> {formatPhone(client.whatsapp || client.phone)}</p>
              <p><span className="text-slate-600">E-mail:</span> {client.email || '-'}</p>
              <p><span className="text-slate-600">Endereço:</span> {client.address.street}, Nº {client.address.number} {client.address.complement ? `(${client.address.complement})` : ''} - {client.address.neighborhood}, {client.address.city}/{client.address.state} - CEP: {formatCEP(client.address.zipCode)}</p>
            </div>
          </div>
        </section>

        {/* 2. DO OBJETO / EQUIPAMENTOS */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            2. OBJETO DA LOCAÇÃO (EQUIPAMENTOS E FERRAMENTAS)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300 rounded-lg">
              <thead className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                <tr>
                  <th className="p-2.5">Item / Descrição da Máquina/Ferramenta</th>
                  <th className="p-2.5">Marca / Modelo</th>
                  <th className="p-2.5">Nº de Série</th>
                  <th className="p-2.5">Alimentação</th>
                  <th className="p-2.5 text-right">Diária Base</th>
                  <th className="p-2.5 text-right bg-amber-50/70 border-l border-amber-200">
                    Valor Reposição (Extravio)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tools.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-medium text-slate-950">
                      <div>{item.toolSnapshot.name}</div>
                      {item.toolSnapshot.accessoriesIncluded && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          <strong>Acessórios/Itens inclusos:</strong> {item.toolSnapshot.accessoriesIncluded}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {item.toolSnapshot.brand} {item.toolSnapshot.model}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {item.toolSnapshot.serialNumber || 'S/N'}
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {getPowerTypeLabel(item.toolSnapshot.powerType, item.toolSnapshot.voltage)}
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(item.dailyPrice)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-950 bg-amber-50/40 border-l border-amber-200">
                      {formatCurrency(item.replacementValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. DO PRAZO, VALORES, MULTAS E EXTRAVIO */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            3. PRAZOS, VALORES, MULTAS E EXTRAVIO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Box 1: Prazos */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[11px]">Prazo de Locação</span>
              <p><span className="text-slate-600">Quantidade de Dias:</span> <strong className="text-slate-950 text-sm font-black">{contract.rentalDays} {contract.rentalDays === 1 ? 'dia' : 'dias'}</strong></p>
              <p><span className="text-slate-600">Data de Retirada:</span> <strong>{formatDateBR(contract.startDate)}</strong></p>
              <p><span className="text-slate-600">Previsão de Devolução:</span> <strong className="text-slate-950 underline">{formatDateBR(contract.expectedEndDate)}</strong></p>
            </div>

            {/* Box 2: Valores */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[11px]">Valores e Pagamento</span>
              <p><span className="text-slate-600">Valor Base Total:</span> {formatCurrency(contract.baseRentalValue)}</p>
              {contract.discountValue > 0 && (
                <p className="text-emerald-700"><span className="text-slate-600">Desconto:</span> -{formatCurrency(contract.discountValue)}</p>
              )}
              {contract.depositValue > 0 && (
                <p><span className="text-slate-600">Caução / Garantia:</span> {formatCurrency(contract.depositValue)}</p>
              )}
              <p className="pt-1 border-t border-slate-300 font-bold text-slate-950 text-sm">
                Valor Total da Locação: {formatCurrency(contract.totalRentalValue)}
              </p>
              <p className="text-[11px] text-slate-600">
                Forma de Pagamento: <strong>{contract.paymentMethod.replace('_', ' ').toUpperCase()}</strong> ({contract.paymentStatus.toUpperCase()})
              </p>
            </div>

            {/* Box 3: Cláusula de Atraso e Extravio (Destaque Principal) */}
            <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Multa por Atraso & Extravio</span>
              </div>
              <p className="text-slate-800">
                ⚠️ <strong>Multa por Dia de Atraso:</strong> <span className="font-black text-rose-700">{formatCurrency(contract.lateFeePerDay)} / dia</span>
                {contract.lateFeePercent > 0 && <span className="text-slate-600"> + {contract.lateFeePercent}% de mora</span>}
              </p>
              <p className="text-slate-900 border-t border-amber-200 pt-1">
                🛡️ <strong>Valor de Indenização (Extravio/Perda):</strong><br />
                <span className="font-black text-slate-950 text-sm">{formatCurrency(contract.totalReplacementValue)}</span>
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                Em caso de não devolução, furto, perda ou destruição das máquinas.
              </p>
            </div>
          </div>
        </section>

        {/* 4. CLÁUSULAS CONTRATUAIS */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            4. CLÁUSULAS E CONDIÇÕES GERAIS
          </h3>

          <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 leading-relaxed">
            {company.customClauses && company.customClauses.length > 0 ? (
              company.customClauses.map((clause, idx) => (
                <li key={idx} className="text-justify">{clause}</li>
              ))
            ) : (
              <>
                <li className="text-justify">
                  O <strong>LOCATÁRIO</strong> declara receber os equipamentos testados, limpos e em perfeitas condições de uso, comprometendo-se a operá-los em conformidade com as normas técnicas do fabricante.
                </li>
                <li className="text-justify">
                  O <strong>LOCATÁRIO</strong> compromete-se a devolver o(s) equipamento(s) até a data limite estipulada neste contrato (<strong>{formatDateBR(contract.expectedEndDate)}</strong>). O atraso na devolução ensejará a aplicação imediata da multa diária de <strong>{formatCurrency(contract.lateFeePerDay)}</strong> mais as diárias correspondentes até a efetiva entrega.
                </li>
                <li className="text-justify">
                  Em caso de <strong>EXTRAVIO, ROUBO, FURTO ou PERDA TOTAL</strong> do(s) equipamento(s), o LOCATÁRIO obriga-se a ressarcir a LOCADORA no montante integral de <strong>{formatCurrency(contract.totalReplacementValue)}</strong>, no prazo impreterível de 48 (quarenta e oito) horas da notificação.
                </li>
                <li className="text-justify">
                  Qualquer solicitação de <strong>RENOVAÇÃO</strong> de prazo deverá ser expressamente comunicada e autorizada pela LOCADORA com no mínimo 24 horas de antecedência ao vencimento.
                </li>
              </>
            )}
            {contract.specialConditions && (
              <li className="text-justify">
                <strong>Condições Especiais:</strong> {contract.specialConditions}
              </li>
            )}
          </ol>
        </section>

        {/* Histórico de Renovações (se houver) */}
        {contract.renewals && contract.renewals.length > 0 && (
          <section className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              ADITIVOS / HISTÓRICO DE RENOVAÇÕES DE PRAZO
            </h4>
            <div className="space-y-1">
              {contract.renewals.map((ren, rIdx) => (
                <div key={rIdx} className="flex justify-between items-center text-slate-700 py-1 border-b border-slate-200 last:border-0">
                  <span>Renovação #{rIdx + 1} em {formatDateBR(ren.date)}: <strong>+{ren.additionalDays} dias</strong> (Novo vencimento: {formatDateBR(ren.newExpectedEndDate)})</span>
                  <span className="font-medium text-slate-900">+{formatCurrency(ren.additionalValue)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Termo de Vistoria e Assinaturas */}
        <section className="pt-6 border-t-2 border-slate-900 space-y-8">
          <p className="text-xs text-center text-slate-600">
            E por estarem justas e acordadas, as partes firmam o presente Contrato de Locação em 2 (duas) vias de igual teor e forma.
          </p>

          <p className="text-xs text-center font-medium text-slate-800">
            {company.address.city || 'São Paulo'} - {company.address.state || 'SP'}, {formatDateBR(contract.startDate)}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
            {/* Assinatura Locadora */}
            <div className="text-center space-y-1">
              <div className="border-t border-slate-900 mx-auto w-4/5 pt-2"></div>
              <strong className="block text-xs font-bold text-slate-950 uppercase">
                {company.legalName}
              </strong>
              <span className="block text-[11px] text-slate-500">
                LOCADORA ({company.representativeName || 'Representante Legal'})
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                CNPJ: {formatDocument(company.cnpjCpf)}
              </span>
            </div>

            {/* Assinatura Locatário */}
            <div className="text-center space-y-1">
              <div className="border-t border-slate-900 mx-auto w-4/5 pt-2"></div>
              <strong className="block text-xs font-bold text-slate-950 uppercase">
                {client.name}
              </strong>
              <span className="block text-[11px] text-slate-500">
                LOCATÁRIO(A) (Assinatura do Responsável)
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {client.documentType}: {formatDocument(client.documentNumber)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
