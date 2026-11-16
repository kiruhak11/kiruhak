BEGIN;

CREATE TABLE "lead_deliveries" (
  "id" TEXT NOT NULL,
  "idempotency_key_hash" TEXT NOT NULL,
  "payload_hash" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "contact" VARCHAR(160),
  "email" VARCHAR(254) NOT NULL,
  "business" VARCHAR(180),
  "task" VARCHAR(4000) NOT NULL,
  "budget" VARCHAR(160),
  "client_fingerprint" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "locked_until" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "telegram_message_id" BIGINT,
  "last_error_code" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "lead_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lead_deliveries_attempt_count_check" CHECK ("attempt_count" >= 0 AND "attempt_count" <= 6),
  CONSTRAINT "lead_deliveries_status_check" CHECK ("status" IN ('PENDING', 'RETRY', 'SENT', 'FAILED'))
);

CREATE UNIQUE INDEX "lead_deliveries_idempotency_key_hash_key"
  ON "lead_deliveries"("idempotency_key_hash");
CREATE INDEX "lead_deliveries_queue_idx"
  ON "lead_deliveries"("status", "next_attempt_at", "locked_until");
CREATE INDEX "lead_deliveries_rate_idx"
  ON "lead_deliveries"("client_fingerprint", "created_at");

COMMIT;
