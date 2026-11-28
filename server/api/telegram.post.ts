import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../utils/prisma";
import {
  LEAD_MAX_BODY_BYTES,
  LEAD_RATE_LIMIT,
  LEAD_RATE_WINDOW_MINUTES,
  getClientAddress,
  leadFingerprint,
  validateLeadInput,
  type LeadInput,
} from "../utils/lead-delivery";

type ExistingLeadRow = { id: string; payload_hash: string };
type LeadCountRow = { count: bigint };

export default defineEventHandler(async (event) => {
  const idempotencyKey = getHeader(event, "idempotency-key")?.trim() || "";

  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: "A valid idempotency key is required",
    });
  }

  const contentLength = Number(getHeader(event, "content-length") || 0);

  if (contentLength > LEAD_MAX_BODY_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "Request is too large",
    });
  }

  let body: unknown;

  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    let tooLarge = false;

    for await (const chunk of event.node.req) {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += data.length;

      if (bytes > LEAD_MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(data);
      }
    }

    if (tooLarge) {
      throw new Error("BODY_TOO_LARGE");
    }

    const raw = Buffer.concat(chunks).toString("utf8");

    if (!raw) {
      throw new Error("INVALID_BODY");
    }

    body = JSON.parse(raw);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "BODY_TOO_LARGE";

    throw createError({
      statusCode: tooLarge ? 413 : 400,
      statusMessage: tooLarge ? "Request is too large" : "Invalid request body",
    });
  }

  let lead: LeadInput;

  try {
    lead = validateLeadInput(body);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_INPUT";
    const statusCode = code === "FIELD_TOO_LONG" ? 413 : 400;

    throw createError({ statusCode, statusMessage: code });
  }

  const keyHash = createHash("sha256").update(idempotencyKey).digest("hex");
  const payloadHash = leadFingerprint(lead);
  const clientHash = createHash("sha256")
    .update(getClientAddress(event))
    .digest("hex");

  try {
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`WITH lock_result AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext(${"lead-idem:" + keyHash})::bigint)
      ) SELECT 1::int AS locked FROM lock_result`;

      const existing = await tx.$queryRaw<ExistingLeadRow[]>`
        SELECT id, payload_hash FROM lead_deliveries WHERE idempotency_key_hash = ${keyHash} FOR UPDATE
      `;

      const existingRow = existing[0];

      if (existingRow) {
        if (existingRow.payload_hash !== payloadHash) {
          throw createError({
            statusCode: 409,
            statusMessage:
              "Idempotency key was already used with different content",
          });
        }

        return { id: existingRow.id, duplicate: true };
      }

      await tx.$queryRaw`WITH lock_result AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext(${clientHash})::bigint)
      ) SELECT 1::int AS locked FROM lock_result`;

      const recent = await tx.$queryRaw<LeadCountRow[]>`
        SELECT COUNT(*)::bigint AS count FROM lead_deliveries
        WHERE client_fingerprint = ${clientHash}
          AND created_at > NOW() - (${LEAD_RATE_WINDOW_MINUTES} * INTERVAL '1 minute')
      `;

      if (Number(recent[0]?.count || 0) >= LEAD_RATE_LIMIT) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many requests",
        });
      }

      const id = randomUUID();

      await tx.$executeRaw`
        INSERT INTO lead_deliveries (
          id, idempotency_key_hash, payload_hash, name, contact, email, business, task, budget,
          client_fingerprint, status, attempt_count, next_attempt_at, created_at, updated_at
        ) VALUES (
          ${id}, ${keyHash}, ${payloadHash}, ${lead.name}, ${lead.contact || null}, ${lead.email ?? null},
          ${lead.business || null}, ${lead.task}, ${lead.budget || null}, ${clientHash},
          'PENDING', 0, NOW(), NOW(), NOW()
        )
      `;

      return { id, duplicate: false };
    });

    setResponseStatus(event, saved.duplicate ? 200 : 202);

    return {
      status: "saved",
      delivery: "queued",
      duplicate: saved.duplicate,
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("[lead-delivery] persistence failed");

    throw createError({
      statusCode: 503,
      statusMessage: "Could not save the request. Please retry.",
    });
  }
});
