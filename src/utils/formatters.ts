import { RentalContract, RentalStatus, ToolPowerType, ToolVoltage } from '../types';

/**
 * Formata um valor numérico para a moeda brasileira Real (R$)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data YYYY-MM-DD para DD/MM/AAAA
 */
export function formatDateBR(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora
 */
export function formatDateTimeBR(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona X dias a uma data YYYY-MM-DD
 */
export function addDaysToDate(dateString: string, days: number): string {
  if (!dateString) return getTodayString();
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days));
  
  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Calcula a diferença em dias entre duas datas (date2 - date1)
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const [y1, m1, d1] = startDateStr.split('-').map(Number);
  const [y2, m2, d2] = endDateStr.split('-').map(Number);
  
  const dStart = new Date(y1, m1 - 1, d1);
  const dEnd = new Date(y2, m2 - 1, d2);
  
  const diffTime = dEnd.getTime() - dStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Verifica o status de prazo de uma locação em relação a hoje
 */
export function getRentalDueStatus(expectedEndDateStr: string, status: RentalStatus): {
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  daysRemainingOrLate: number;
  label: string;
  badgeColor: string;
} {
  if (status === 'devolvida') {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysRemainingOrLate: 0,
      label: 'Devolvida',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  if (status === 'cancelada') {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysRemainingOrLate: 0,
      label: 'Cancelada',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const todayStr = getTodayString();
  const diff = calculateDaysBetween(todayStr, expectedEndDateStr);

  if (diff < 0) {
    const lateDays = Math.abs(diff);
    return {
      isOverdue: true,
      isDueToday: false,
      isDueTomorrow: false,
      daysRemainingOrLate: lateDays,
      label: `Atrasada (${lateDays} ${lateDays === 1 ? 'dia' : 'dias'})`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }

  if (diff === 0) {
    return {
      isOverdue: false,
      isDueToday: true,
      isDueTomorrow: false,
      daysRemainingOrLate: 0,
      label: 'Vence Hoje',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
    };
  }

  if (diff === 1) {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: true,
      daysRemainingOrLate: 1,
      label: 'Vence Amanhã',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }

  return {
    isOverdue: false,
    isDueToday: false,
    isDueTomorrow: false,
    daysRemainingOrLate: diff,
    label: `Vence em ${diff} dias`,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

/**
 * Formata CPF ou CNPJ com máscara
 */
export function formatDocument(doc: string | undefined): string {
  if (!doc) return '-';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export function formatCPF(cpf: string | undefined): string {
  return formatDocument(cpf);
}

export function formatCNPJ(cnpj: string | undefined): string {
  return formatDocument(cnpj);
}

/**
 * Formata Telefone / Celular / WhatsApp
 */
export function formatPhone(phone: string | undefined): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string | undefined): string {
  if (!cep) return '-';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
}

/**
 * Rótulo amigável para tipo de alimentação da ferramenta
 */
export function getPowerTypeLabel(powerType: ToolPowerType, voltage?: ToolVoltage): string {
  switch (powerType) {
    case 'eletrica_cabo':
      return `Elétrica (${voltage || '220V'})`;
    case 'bateria':
      return 'Bateria Recarregável';
    case 'manual':
      return 'Manual';
    case 'gasolina':
      return 'A Combustão (Gasolina)';
    case 'pneumatica':
      return 'Pneumática (Ar Comprimido)';
    default:
      return 'Outro';
  }
}

/**
 * Gera mensagem formatada para envio no WhatsApp
 */
export function generateWhatsAppMessage(
  type: 'lembrete_vencimento' | 'atraso' | 'novo_contrato' | 'renovacao' | 'devolucao',
  contract: RentalContract
): string {
  const clientName = contract.clientSnapshot.name;
  const companyName = contract.companySnapshot.tradeName || contract.companySnapshot.legalName;
  const toolsList = contract.tools.map(t => `• ${t.toolSnapshot.name} (${t.toolSnapshot.brand || ''} ${t.toolSnapshot.model || ''})`).join('\n');
  const expectedDate = formatDateBR(contract.expectedEndDate);
  
  let msg = '';
  
  if (type === 'lembrete_vencimento') {
    msg = `Olá *${clientName}*, tudo bem?\n\n` +
      `Aqui é da *${companyName}*. Passando para lembrar que a locação nº *${contract.contractNumber}* tem previsão de devolução para *${expectedDate}*.\n\n` +
      `📦 *Equipamento(s):*\n${toolsList}\n\n` +
      `Deseja agendar a devolução ou prefere fazer a *renovação* por mais alguns dias?\n` +
      `Ficamos à disposição!`;
  } else if (type === 'atraso') {
    const todayStr = getTodayString();
    const diff = calculateDaysBetween(contract.expectedEndDate, todayStr);
    const lateDays = Math.max(1, diff);
    const lateFeeEstimated = lateDays * (contract.lateFeePerDay || 0);

    msg = `Olá *${clientName}*,\n\n` +
      `Notamos que o contrato de locação nº *${contract.contractNumber}* venceu em *${expectedDate}* e consta com *${lateDays} ${lateDays === 1 ? 'dia' : 'dias'} de atraso*.\n\n` +
      `📦 *Equipamento(s):*\n${toolsList}\n\n` +
      `⚠️ *Multa por dia de atraso:* ${formatCurrency(contract.lateFeePerDay)}/dia (Total estimado: ${formatCurrency(lateFeeEstimated)}).\n\n` +
      `Por favor, entre em contato com a *${companyName}* para regularizar a devolução ou renovar o contrato. Obrigado!`;
  } else if (type === 'novo_contrato') {
    msg = `Olá *${clientName}*, segue o resumo da sua locação na *${companyName}*:\n\n` +
      `📄 *Contrato:* ${contract.contractNumber}\n` +
      `📦 *Equipamento(s):*\n${toolsList}\n` +
      `📅 *Período:* ${formatDateBR(contract.startDate)} até *${expectedDate}* (${contract.rentalDays} dias)\n` +
      `💰 *Valor da Locação:* ${formatCurrency(contract.totalRentalValue)}\n` +
      `⚠️ *Multa diária por atraso:* ${formatCurrency(contract.lateFeePerDay)}\n` +
      `🛡️ *Valor de reposição (extravio/perda):* ${formatCurrency(contract.totalReplacementValue)}\n\n` +
      `Agradecemos a preferência! Cuide bem dos equipamentos. Qualquer dúvida estamos à disposição.`;
  } else if (type === 'renovacao') {
    const latestRenewal = contract.renewals[contract.renewals.length - 1];
    msg = `Olá *${clientName}*!\n\n` +
      `Confirmamos a *renovação* da locação nº *${contract.contractNumber}* na *${companyName}*.\n\n` +
      `➕ *Dias adicionados:* +${latestRenewal?.additionalDays || 0} dias\n` +
      `📅 *Nova data de devolução:* *${expectedDate}*\n` +
      `💰 *Valor adicional:* ${formatCurrency(latestRenewal?.additionalValue || 0)}\n\n` +
      `Bom trabalho com os equipamentos!`;
  } else if (type === 'devolucao') {
    msg = `Olá *${clientName}*!\n\n` +
      `Confirmamos o encerramento e devolução do contrato de locação nº *${contract.contractNumber}* na *${companyName}*.\n\n` +
      `Equipamentos conferidos e recebidos com sucesso. Agradecemos a parceria e esperamos atendê-lo novamente em breve! 👍`;
  }

  return encodeURIComponent(msg);
}

/**
 * Abre o link do WhatsApp para o número informado
 */
export function openWhatsApp(phone: string, messageEncoded: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const finalNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  window.open(`https://wa.me/${finalNumber}?text=${messageEncoded}`, '_blank');
}
