export const LEAD_FIELD_LIMITS = {
  name: 120,
  contact: 160,
  email: 254,
  business: 180,
  task: 4000,
  budget: 160,
} as const;

export type LeadField = keyof typeof LEAD_FIELD_LIMITS;
export type LeadFormValues = Record<LeadField, string>;
export type LeadReplyMethod = "email" | "telegram" | "phone";
export type LeadFieldErrors = Partial<Record<LeadField, string>>;

export const isValidLeadEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isTelegram = (value: string) => /^@[a-z0-9_]{5,32}$/i.test(value.trim());
const isPhone = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  return /^\+?[\d()\s.-]+$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15;
};

export function validateLeadFields(values: Partial<LeadFormValues>, method?: LeadReplyMethod): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  const name = values.name?.trim();
  const email = values.email?.trim() || "";
  const contact = values.contact?.trim() || "";
  const task = values.task?.trim();

  if (!name) errors.name = "Укажите, как к вам обращаться.";
  if (method === "email" || email) {
    if (!email) errors.email = "Введите электронную почту.";
    else if (!isValidLeadEmail(email)) errors.email = "Введите адрес в формате name@example.com.";
  } else if (method === "telegram") {
    if (!isTelegram(contact)) errors.contact = "Введите имя пользователя Telegram с @, например @username.";
  } else if (method === "phone") {
    if (!isPhone(contact)) errors.contact = "Введите номер телефона, например +7 900 000-00-00.";
  } else if (!contact || !(isTelegram(contact) || isPhone(contact))) {
    errors.contact = "Укажите электронную почту, Telegram или номер телефона.";
  }
  if (!task) errors.task = "Коротко опишите, о чём хотите поговорить.";

  for (const field of Object.keys(LEAD_FIELD_LIMITS) as LeadField[]) {
    const limit = LEAD_FIELD_LIMITS[field];
    if ((values[field]?.trim().length ?? 0) > limit) {
      errors[field] = `Сократите текст до ${limit} символов.`;
    }
  }
  return errors;
}
