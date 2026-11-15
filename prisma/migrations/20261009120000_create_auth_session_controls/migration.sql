CREATE TABLE IF NOT EXISTS "auth_session_controls" (
    "user_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "auth_session_controls_pkey" PRIMARY KEY ("user_id")
);
