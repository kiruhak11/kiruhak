CREATE TABLE "auth_revoked_sessions" (
    "session_key_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "auth_revoked_sessions_pkey" PRIMARY KEY ("session_key_hash")
);

CREATE INDEX "auth_revoked_sessions_expires_at_idx"
    ON "auth_revoked_sessions"("expires_at");
