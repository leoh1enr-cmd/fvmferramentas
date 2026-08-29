import { PushNotificationRecord, RentalContract } from '../types';
import { calculateDaysBetween, formatCurrency, formatDateBR, getTodayString } from './formatters';

const STORAGE_KEY_NOTIFICATION_LOGS = 'fvm_notification_logs_v1';
const STORAGE_KEY_SENT_TRIGGERS = 'fvm_sent_notification_triggers_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

export function getNotificationHistory(): PushNotificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATION_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading notification history:', e);
  }
  return [];
}

export function saveNotificationHistory(records: PushNotificationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_LOGS, JSON.stringify(records.slice(0, 100))); // Keep latest 100
  } catch (e) {
    console.error('Error saving notification history:', e);
  }
}

function getSentTriggers(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_TRIGGERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading sent triggers:', e);
  }
  return {};
}

function recordSentTrigger(triggerKey: string): void {
  try {
    const sent = getSentTriggers();
    sent[triggerKey] = true;
    localStorage.setItem(STORAGE_KEY_SENT_TRIGGERS, JSON.stringify(sent));
  } catch (e) {
    console.error('Error saving sent trigger:', e);
  }
}

/**
 * Web Audio API gentle synth notification sound
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First harmonic
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second bell chime note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    // Audio might be blocked if no user gesture yet, which is safe to ignore
    console.warn('Audio chime warning:', e);
  }
}

/**
 * Dispatch a native system browser push notification if permitted
 */
export function dispatchBrowserNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (e) {
    console.error('Failed to trigger native Notification:', e);
    return null;
  }
}

/**
 * Core engine to inspect contracts and fire automated push notifications:
 * 1. 5 days before expected return date
 * 2. On the day of due date
 * 3. When overdue (if not yet marked as returned)
 */
export function checkAndSendRentalNotifications(contracts: RentalContract[]): {
  sentCount: number;
  newRecords: PushNotificationRecord[];
} {
  const todayStr = getTodayString();
  const sentTriggers = getSentTriggers();
  const history = getNotificationHistory();
  const newRecords: PushNotificationRecord[] = [];

  // Filter only active contracts (not returned and not canceled)
  const activeContracts = contracts.filter(
    c => c.status !== 'devolvida' && c.status !== 'cancelada'
  );

  activeContracts.forEach(contract => {
    const diff = calculateDaysBetween(todayStr, contract.expectedEndDate);
    const toolNames = contract.tools.map(t => t.toolSnapshot.name).join(', ');
    const clientName = contract.clientSnapshot.name;

    // 1. RULE: 5 days before expected end date
    if (diff === 5) {
      const triggerKey = `trigger_5d_${contract.id}_${contract.expectedEndDate}`;
      if (!sentTriggers[triggerKey]) {
        const title = `⏳ Lembrete: Devolução em 5 dias (${contract.contractNumber})`;
        const body = `A locação de ${clientName} vence em 5 dias (${formatDateBR(contract.expectedEndDate)}). Ferramentas: ${toolNames}.`;

        dispatchBrowserNotification(title, {
          body,
          tag: `fvm-5d-${contract.id}`,
        });

        const record: PushNotificationRecord = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          clientName,
          type: '5_days_before',
          title,
          body,
          sentAt: new Date().toISOString(),
          read: false,
        };

        newRecords.push(record);
        recordSentTrigger(triggerKey);
      }
    }

    // 2. RULE: On the day of expected return (due today)
    if (diff === 0) {
      const triggerKey = `trigger_today_${contract.id}_${todayStr}`;
      if (!sentTriggers[triggerKey]) {
        const title = `🔔 Vence Hoje: Contrato ${contract.contractNumber}`;
        const body = `Devolução prevista para hoje (${formatDateBR(contract.expectedEndDate)}) - ${clientName}. Verifique a entrega ou realize a renovação.`;

        dispatchBrowserNotification(title, {
          body,
          tag: `fvm-today-${contract.id}`,
        });

        const record: PushNotificationRecord = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          clientName,
          type: 'due_today',
          title,
          body,
          sentAt: new Date().toISOString(),
          read: false,
        };

        newRecords.push(record);
        recordSentTrigger(triggerKey);
      }
    }

    // 3. RULE: Overdue (in atraso) - notify once per day in delay
    if (diff < 0) {
      const lateDays = Math.abs(diff);
      const triggerKey = `trigger_overdue_${contract.id}_${todayStr}`;
      if (!sentTriggers[triggerKey]) {
        const feeInfo = contract.lateFeePerDay ? ` | Multa: ${formatCurrency(contract.lateFeePerDay * lateDays)}` : '';
        const title = `⚠️ Em Atraso (${lateDays}d): Contrato ${contract.contractNumber}`;
        const body = `${clientName} está com ${lateDays} dia(s) de atraso na devolução${feeInfo}. Ferramentas: ${toolNames}.`;

        dispatchBrowserNotification(title, {
          body,
          tag: `fvm-overdue-${contract.id}`,
        });

        const record: PushNotificationRecord = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          clientName,
          type: 'overdue',
          title,
          body,
          sentAt: new Date().toISOString(),
          read: false,
        };

        newRecords.push(record);
        recordSentTrigger(triggerKey);
      }
    }
  });

  if (newRecords.length > 0) {
    playNotificationChime();
    const updatedHistory = [...newRecords, ...history];
    saveNotificationHistory(updatedHistory);
  }

  return {
    sentCount: newRecords.length,
    newRecords,
  };
}

/**
 * Send a test push notification to verify permissions and audio
 */
export function sendTestNotification(): PushNotificationRecord {
  const title = '🔔 Teste de Notificação Push - FVM Ferramentas';
  const body = 'O sistema de lembretes automáticos de 5 dias antes e vencimento está configurado e pronto!';

  dispatchBrowserNotification(title, {
    body,
    tag: 'fvm-test-notification',
  });

  playNotificationChime();

  const record: PushNotificationRecord = {
    id: `notif-test-${Date.now()}`,
    type: 'test',
    title,
    body,
    sentAt: new Date().toISOString(),
    read: false,
  };

  const history = getNotificationHistory();
  saveNotificationHistory([record, ...history]);

  return record;
}

export function clearNotificationHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_NOTIFICATION_LOGS);
    localStorage.removeItem(STORAGE_KEY_SENT_TRIGGERS);
  } catch (e) {
    console.error('Error clearing notification history:', e);
  }
}
