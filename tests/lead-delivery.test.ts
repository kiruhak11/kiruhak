import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEAD_MAX_BODY_BYTES,
  LEAD_RATE_LIMIT,
  LEAD_RATE_WINDOW_MINUTES,
  leadFingerprint,
  validateLeadInput,
} from "../server/utils/lead-delivery";

import { formatLeadMessage, sendLeadNotification } from "../server/utils/lead-notification";
import { encodeLeadConfirmation, parseLeadMessageId, readLeadConfirmation } from "../server/utils/lead-confirmation";
import { needsLeadDeliveryConfirmation } from "../types/admin-lead";

const telegramLead = { id: "lead-fixture", name: "Ирина", email: "demo@example.test", task: "Сайт" };
const createdAt = new Date("2026-11-27T09:00:00Z");
const mockResponse = (status: number, payload: unknown) => async () => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => payload,
});

test("lead input validation accepts a complete application", () => {
  const lead = validateLeadInput({
    name: "  Кирилл  ",
    contact: " @kiruhak11bot ",
    email: " web@kiruhak11.ru ",
    business: " Услуги ",
    task: " Нужен лендинг ",
    budget: " от 150 000 ₽ ",
  });

  assert.deepEqual(lead, {
    name: "Кирилл",
    contact: "@kiruhak11bot",
    email: "web@kiruhak11.ru",
    business: "Услуги",
    task: "Нужен лендинг",
    budget: "от 150 000 ₽",
  });
});

test("lead input validation requires name, a reply channel and task", () => {
  assert.throws(
    () => validateLeadInput({ email: "web@kiruhak11.ru", task: "x" }),
    /REQUIRED_FIELDS/
  );
  assert.throws(
    () => validateLeadInput({ name: "К", task: "x" }),
    /REQUIRED_FIELDS/
  );
  assert.throws(
    () => validateLeadInput({ name: "К", email: "web@kiruhak11.ru" }),
    /REQUIRED_FIELDS/
  );
});

test("lead input validation rejects malformed payloads", () => {
  assert.throws(() => validateLeadInput(null), /INVALID_INPUT/);
  assert.throws(() => validateLeadInput("string"), /INVALID_INPUT/);
  assert.throws(() => validateLeadInput([]), /INVALID_INPUT/);
  assert.throws(
    () => validateLeadInput({ name: 1, email: "a@b.co", task: "t" }),
    /INVALID_INPUT/
  );
  assert.throws(
    () => validateLeadInput({ name: "К", email: "not-an-email", task: "t" }),
    /INVALID_EMAIL/
  );
});

test("lead input validation rejects oversized fields", () => {
  assert.throws(
    () =>
      validateLeadInput({
        name: "К",
        email: "a@b.co",
        task: "x".repeat(4001),
      }),
    /FIELD_TOO_LONG/
  );
});

test("lead fingerprint is stable and payload sensitive", () => {
  const lead = validateLeadInput({
    name: "К",
    email: "a@b.co",
    task: "t",
  });

  const same = validateLeadInput({
    name: "К",
    email: "a@b.co",
    task: "t",
  });
  const other = validateLeadInput({
    name: "К",
    email: "a@b.co",
    task: "другая задача",
  });

  assert.equal(leadFingerprint(lead), leadFingerprint(same));
  assert.notEqual(leadFingerprint(lead), leadFingerprint(other));
  assert.match(leadFingerprint(lead), /^[a-f0-9]{64}$/);
});

test("lead delivery limits match the production configuration", () => {
  assert.equal(LEAD_MAX_BODY_BYTES, 16 * 1024);
  assert.equal(LEAD_RATE_LIMIT, 5);
  assert.equal(LEAD_RATE_WINDOW_MINUTES, 15);
});

test("long Telegram notifications preserve the ID and metadata within 4096 UTF-16 units", () => {
  const task = "🧪".repeat(2000);
  const text = formatLeadMessage({ ...telegramLead, task, budget: "150 000 ₽" }, createdAt);
  assert.ok(text.length <= 4096);
  assert.ok(text.isWellFormed());
  assert.match(text, /ID заявки: lead-fixture/);
  assert.match(text, /150 000 ₽/);
  assert.match(text, /Продолжение в админке/);
  assert.match(formatLeadMessage(telegramLead, createdAt), /Задача: Сайт$/);
});

test("Telegram acknowledgement requires a valid message ID", async () => {
  const sent = await sendLeadNotification(telegramLead, createdAt, "1", "123:TEST",
    mockResponse(200, { ok: true, result: { message_id: 42 } }));
  assert.deepEqual(sent, { messageId: 42n });

  await assert.rejects(sendLeadNotification(telegramLead, createdAt, "1", "123:TEST",
    mockResponse(200, { ok: true })), /TELEGRAM_DELIVERY_UNCONFIRMED/);
});

test("retry-after is honored only on a definite rate-limit response", async () => {
  const send = (status: number, payload: unknown) =>
    sendLeadNotification(telegramLead, createdAt, "1", "123:TEST", mockResponse(status, payload));
  await assert.rejects(send(429, { ok: false, parameters: { retry_after: 120 } }),
    { code: "TELEGRAM_RATE_LIMIT", retryAfterSeconds: 120 });
  await assert.rejects(send(400, { ok: false }), { code: "TELEGRAM_HTTP_400" });
  await assert.rejects(send(502, {}), { code: "TELEGRAM_DELIVERY_UNCONFIRMED" });
  await assert.rejects(send(408, {}), { code: "TELEGRAM_TIMEOUT_UNCONFIRMED" });
});

test("manual retry requires a Telegram check after an unconfirmed delivery", () => {
  for (const code of [
    "TELEGRAM_TIMEOUT_UNCONFIRMED", "TELEGRAM_DELIVERY_UNCONFIRMED", "WORKER_LEASE_UNCONFIRMED",
    "WORKER_LEASE_EXHAUSTED", "REQUEST_FAILED", "TELEGRAM_HTTP_502",
  ]) {
    assert.equal(needsLeadDeliveryConfirmation(code), true, code);
  }

  for (const code of ["TELEGRAM_RATE_LIMIT", "TELEGRAM_HTTP_400", "TELEGRAM_PROXY_NOT_CONFIGURED"]) {
    assert.equal(needsLeadDeliveryConfirmation(code), false, code);
  }
});


test("manual confirmation parses a positive PostgreSQL bigint without losing precision", () => {
  assert.equal(parseLeadMessageId("9007199254740993"), 9007199254740993n);
  assert.equal(parseLeadMessageId("9223372036854775807"), 9223372036854775807n);
  for (const bad of ["0", "-5", "01", "1e3", "1.0", "9223372036854775808", 12, null]) {
    assert.equal(parseLeadMessageId(bad), null, String(bad));
  }
});

test("manual confirmation audit preserves actor, time and original delivery error", () => {
  const audit = {
    adminId: "fixture-admin",
    confirmedAt: "2026-11-27T10:00:00.000Z",
    previousErrorCode: "TELEGRAM_TIMEOUT_UNCONFIRMED",
  };
  assert.deepEqual(readLeadConfirmation(encodeLeadConfirmation(audit)), audit);
  assert.equal(readLeadConfirmation("TELEGRAM_TIMEOUT_UNCONFIRMED"), null);
  assert.equal(readLeadConfirmation("MANUAL_CONFIRMED:{}"), null);
});

test("lead accepts Telegram or phone without email and rejects an unusable contact", () => {
  for (const contact of ["@tester", "+7 (900) 123-45-67"]) {
    const lead = validateLeadInput({ name: "Тест", contact, task: "Проект" });
    assert.equal(lead.contact, contact);
    assert.equal(lead.email, undefined);
  }

  assert.throws(() => validateLeadInput({ name: "Тест", contact: "telegram", task: "Проект" }), /INVALID_CONTACT/);
});

test("notification includes the selected contact without a blank email line", () => {
  const message = formatLeadMessage({ ...telegramLead, email: null, contact: "@tester" }, new Date(0));
  assert.match(message, /Telegram или телефон: @tester/);
  assert.doesNotMatch(message, /Email:/);
});
