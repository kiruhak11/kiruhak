CREATE TABLE "telegram_login_transactions" (
    "state_hash" TEXT NOT NULL,
    "nonce_hash" TEXT NOT NULL,
    "browser_secret_hash" TEXT NOT NULL,
    "client_key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "telegram_login_transactions_pkey" PRIMARY KEY ("state_hash")
);

CREATE INDEX "telegram_login_transactions_expires_at_idx"
  ON "telegram_login_transactions"("expires_at");
CREATE INDEX "telegram_login_transactions_client_key_hash_created_at_idx"
  ON "telegram_login_transactions"("client_key_hash", "created_at");
