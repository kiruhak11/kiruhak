export const LEAD_STATUSES = ["PENDING", "RETRY", "SENT", "FAILED"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  PENDING: "В очереди",
  RETRY: "Ожидает повтора",
  SENT: "Доставлена",
  FAILED: "Ошибка доставки",
};

export type LeadCounts = { undelivered: number; failed: number };

export type LeadManualConfirmation = {
  adminId: string;
  confirmedAt: string;
  previousErrorCode: string | null;
};

export type AdminLead = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  business: string | null;
  task: string;
  budget: string | null;
  status: LeadStatus;
  attemptCount: number;
  nextAttemptAt: string;
  lockedUntil: string | null;
  sentAt: string | null;
  telegramMessageId: string | null;
  lastErrorCode: string | null;
  manualConfirmation: LeadManualConfirmation | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminLeadPage = { leads: AdminLead[]; total: number; pageSize: number };

export function isLeadStatus(value: unknown): value is LeadStatus {
  return LEAD_STATUSES.some(status => status === value);
}

export function needsLeadDeliveryConfirmation(code: string | null): boolean {
  return !code || code.endsWith("_UNCONFIRMED") ||
    code === "REQUEST_FAILED" || code === "TRANSPORT_ERROR" ||
    code === "WORKER_LEASE_EXHAUSTED" || /^TELEGRAM_HTTP_(408|5\d\d)$/.test(code);
}
