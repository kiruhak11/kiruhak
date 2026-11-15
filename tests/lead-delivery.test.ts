import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEAD_MAX_BODY_BYTES,
  LEAD_RATE_LIMIT,
  LEAD_RATE_WINDOW_MINUTES,
  leadFingerprint,
  validateLeadInput,
} from "../server/utils/lead-delivery";

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

test("lead input validation requires name, email and task", () => {
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
