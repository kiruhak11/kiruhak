BEGIN;

CREATE TABLE "telegram_recovery_challenges" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "state_hash" TEXT NOT NULL,
  "nonce_hash" TEXT NOT NULL,
  "pkce_verifier" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "callback_started_at" TIMESTAMPTZ,
  "telegram_verified_at" TIMESTAMPTZ,
  "consumed_at" TIMESTAMPTZ,
  CONSTRAINT "telegram_recovery_challenges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "telegram_recovery_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "telegram_recovery_challenges_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 5)
);

CREATE UNIQUE INDEX "telegram_recovery_challenges_state_hash_key"
  ON "telegram_recovery_challenges"("state_hash");
CREATE INDEX "telegram_recovery_challenges_user_created_idx"
  ON "telegram_recovery_challenges"("user_id", "created_at");
CREATE INDEX "telegram_recovery_challenges_expiry_idx"
  ON "telegram_recovery_challenges"("expires_at");

COMMIT;
