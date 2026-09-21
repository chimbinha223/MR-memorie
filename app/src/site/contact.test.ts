import { describe, expect, test } from "bun:test";
import {
  buildWhatsApp,
  formatContactMessage,
  formatDate,
  isCalendarDate,
  normalizeCategory,
  todayInLisbon,
  validateContact,
} from "./contact";
import type { ContactValues } from "./contact";

const valid: ContactValues = {
  name: "Ana Silva",
  category: "casais",
  location: "Viana do Castelo",
};
const today = "2026-09-18";

describe("contact request", () => {
  test("rejects unknown and prototype category keys instead of trusting query input", () => {
    for (const category of [
      "desconhecida",
      "__proto__",
      "constructor",
      "<script>alert(1)</script>",
    ]) {
      expect(normalizeCategory(category)).toBe("");
      expect(validateContact({ ...valid, category }, today).category).toBeDefined();
      expect(() => buildWhatsApp({ ...valid, category })).toThrow();
    }
    expect(normalizeCategory("casais")).toBe("casais");
  });

  test("encodes accents, emojis, ampersands and plus signs without corrupting the message", () => {
    const values = {
      ...valid,
      name: "João & Ana",
      message: "Nós + o mar 💛\nUma ideia & duas pessoas.",
    };
    const url = new URL(buildWhatsApp(values));
    expect(url.origin + url.pathname).toBe("https://wa.me/351938348287");
    expect(url.searchParams.get("text")).toBe(formatContactMessage(values));
    expect(url.searchParams.size).toBe(1);
    expect(url.searchParams.get("text")).toContain("Nós + o mar 💛");
  });

  test("keeps selected ISO dates unchanged while determining today in Lisbon across DST", () => {
    expect(formatDate("2026-07-02")).toBe("02/07/2026");
    expect(todayInLisbon(new Date("2026-07-01T23:30:00Z"))).toBe("2026-07-02");
    expect(todayInLisbon(new Date("2026-01-01T23:30:00Z"))).toBe("2026-01-01");
    expect(todayInLisbon(new Date("2026-07-01T16:30:00-07:00"))).toBe("2026-07-02");
  });

  test("rejects nonexistent calendar dates and handles leap years", () => {
    expect(validateContact({ ...valid, date: "2026-02-30" }, "2026-01-01").date).toBe(
      "Informe uma data válida.",
    );
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("18/09/2026")).toBe(false);
  });

  test("rejects past dates while accepting today and future dates", () => {
    expect(validateContact({ ...valid, date: "2026-09-17" }, today).date).toBeDefined();
    expect(validateContact({ ...valid, date: today }, today)).toEqual({});
    expect(validateContact({ ...valid, date: "2026-09-19" }, today)).toEqual({});
    expect(
      validateContact({ ...valid, name: " ", location: "A", message: "a".repeat(1201) }, today),
    ).toMatchObject({
      name: expect.any(String),
      location: expect.any(String),
      message: expect.any(String),
    });
  });

  test("allows omitted optional fields and formats honest details for an undecided birthday", () => {
    expect(validateContact(valid, today)).toEqual({});
    const values = { ...valid, category: "aniversarios" };
    const message = formatContactMessage(values);
    expect(message).toContain("Tipo de aniversário: A definir");
    expect(message).toContain("Data desejada: A definir");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("Mensagem:");
    expect(message.endsWith("Local: Viana do Castelo")).toBe(true);
  });
});
