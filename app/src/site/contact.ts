export const categoryLabels = {
  casais: "Casais",
  aniversarios: "Aniversários",
  casuais: "Ensaios casuais",
} as const;

export type ContactCategory = string;
export type BirthdayType = "festa" | "ensaio" | "a-definir";

export interface ContactValues {
  name: string;
  category: string;
  location: string;
  date?: string;
  message?: string;
  birthdayType?: string;
}

export type ContactField = keyof ContactValues;
export type ContactErrors = Partial<Record<ContactField, string>>;

const birthdayLabels: Record<BirthdayType, string> = {
  festa: "Cobertura de festa",
  ensaio: "Ensaio comemorativo",
  "a-definir": "A definir",
};

export function normalizeCategory(
  value: unknown,
  labels: Record<string, string> = categoryLabels,
): ContactCategory | "" {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(labels, value)
    ? (value as ContactCategory)
    : "";
}

/** Returns a calendar date in Portugal, independent of the visitor's time zone. */
export function todayInLisbon(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Validate the calendar directly: Date parsing would silently normalize February 30. */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearString, monthString, dayString] = match;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

/** No Date construction: a chosen calendar date must never shift with a time zone. */
export function formatDate(value?: string): string {
  if (!value || !isCalendarDate(value)) return "A definir";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function validateContact(
  values: ContactValues,
  today: string = todayInLisbon(),
  labels: Record<string, string> = categoryLabels,
): ContactErrors {
  const errors: ContactErrors = {};
  if (Array.from(values.name.trim()).length < 2)
    errors.name = "Informe seu nome com pelo menos 2 caracteres.";
  const category = normalizeCategory(values.category, labels);
  if (!category) errors.category = "Escolha o tipo de experiência.";
  if (values.date) {
    if (!isCalendarDate(values.date)) errors.date = "Informe uma data válida.";
    else if (values.date < today) errors.date = "Escolha a data de hoje ou uma data futura.";
  }
  if (Array.from(values.location.trim()).length < 2)
    errors.location = "Informe uma cidade ou local com pelo menos 2 caracteres.";
  if (
    category === "aniversarios" &&
    values.birthdayType &&
    !Object.prototype.hasOwnProperty.call(birthdayLabels, values.birthdayType)
  ) {
    errors.birthdayType = "Escolha festa, ensaio ou a definir.";
  }
  if (Array.from(values.message ?? "").length > 1200)
    errors.message = "Use até 1.200 caracteres na mensagem.";
  return errors;
}

export function formatContactMessage(
  values: ContactValues,
  labels: Record<string, string> = categoryLabels,
  brandName = "MR Memorie",
): string {
  const category = normalizeCategory(values.category, labels);
  if (!category) throw new Error("Escolha uma categoria válida antes de preparar a mensagem.");
  const lines = [
    `Olá, ${brandName}! Gostaria de saber mais sobre uma sessão.`,
    "",
    `Nome: ${values.name.trim()}`,
    `Experiência: ${labels[category]}`,
  ];
  if (category === "aniversarios") {
    const birthdayType =
      values.birthdayType &&
      Object.prototype.hasOwnProperty.call(birthdayLabels, values.birthdayType)
        ? (values.birthdayType as BirthdayType)
        : "a-definir";
    lines.push(`Tipo de aniversário: ${birthdayLabels[birthdayType]}`);
  }
  lines.push(`Data desejada: ${formatDate(values.date)}`, `Local: ${values.location.trim()}`);
  if (values.message?.trim()) lines.push("", values.message.trim());
  return lines.join("\n");
}

export function buildWhatsApp(
  values: ContactValues,
  phone = "351938348287",
  labels: Record<string, string> = categoryLabels,
  brandName = "MR Memorie",
): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(formatContactMessage(values, labels, brandName))}`;
}
