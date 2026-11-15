import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { prisma } from "../server/utils/prisma";
import {
  getAuthSessionKeyHash,
  getAuthTokenTimes,
  wasTokenIssuedBeforeRevocation,
} from "../server/utils/auth-token";
import {
  getUserSessionsRevokedAt,
  isAuthSessionRevoked,
  revokeAllUserSessions,
  revokeAuthSession,
} from "../server/utils/session-control";

/**
 * Интеграционный тест отзыва сессий.
 *
 * Требует изолированную PostgreSQL с синтетическими данными:
 *   TEST_DATABASE_URL=postgres://... npm run test:session-revocation
 *
 * Без переменной окружения тест пропускается, а не падает.
 */
const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const skip = databaseUrl ? false : "requires TEST_DATABASE_URL";

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS auth_session_controls (
      user_id TEXT PRIMARY KEY,
      revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS auth_revoked_sessions (
      session_key_hash TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

test("session revocation round-trip against an isolated database", { skip }, async () => {
  await ensureTables();

  const userId = `test-user-${randomUUID()}`;
  const sessionToken = `test-token-${randomUUID()}`;
  const otherToken = `test-token-${randomUUID()}`;

  const sessionKeyHash = getAuthSessionKeyHash(sessionToken, {});
  const otherKeyHash = getAuthSessionKeyHash(otherToken, {});

  try {
    // Изначально сессия не отозвана.
    assert.equal(await isAuthSessionRevoked(sessionKeyHash), false);
    assert.equal(await getUserSessionsRevokedAt(userId), null);

    // Отзыв конкретной сессии не затрагивает другие.
    const { iat, exp } = getAuthTokenTimes(3600);
    await revokeAuthSession(sessionKeyHash, new Date(exp * 1000));

    assert.equal(await isAuthSessionRevoked(sessionKeyHash), true);
    assert.equal(await isAuthSessionRevoked(otherKeyHash), false);

    // Отзыв всех сессий пользователя выставляет временную метку.
    await revokeAllUserSessions(userId);
    const revokedAt = await getUserSessionsRevokedAt(userId);
    assert.ok(revokedAt instanceof Date);

    // Токен, выданный до отзыва, считается отозванным.
    assert.equal(wasTokenIssuedBeforeRevocation(iat, revokedAt), true);
    const future = getAuthTokenTimes(3600, Date.now() + 7 * 24 * 60 * 60 * 1000);
    assert.equal(
      wasTokenIssuedBeforeRevocation(future.iat, revokedAt),
      false
    );
  } finally {
    await prisma.$executeRawUnsafe(
      `DELETE FROM auth_revoked_sessions WHERE session_key_hash IN ($1, $2)`,
      sessionKeyHash,
      otherKeyHash
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM auth_session_controls WHERE user_id = $1`,
      userId
    );
  }
});
