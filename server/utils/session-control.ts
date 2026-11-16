import { prisma } from "./prisma";

/**
 * Минимальный контракт исполнителя SQL-операций Prisma.
 * Позволяет выполнять те же запросы через транзакцию (`tx`) или напрямую.
 */
export interface PrismaSqlExecutor {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
}

/**
 * Отзывает все сессии пользователя (выход со всех устройств).
 */
export async function revokeAllUserSessions(
  userId: string,
  executor: PrismaSqlExecutor = prisma
): Promise<void> {
  await executor.$executeRawUnsafe(
    `
      INSERT INTO auth_session_controls (user_id, revoked_at)
      VALUES ($1, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET revoked_at = EXCLUDED.revoked_at
    `,
    userId
  );
}

/**
 * Возвращает момент отзыва всех сессий пользователя либо null.
 */
export async function getUserSessionsRevokedAt(
  userId: string,
  executor: PrismaSqlExecutor = prisma
): Promise<Date | null> {
  const rows = await executor.$queryRawUnsafe<{ revoked_at: Date }[]>(
    `
      SELECT revoked_at
      FROM auth_session_controls
      WHERE user_id = $1
      LIMIT 1
    `,
    userId
  );

  if (!rows.length) return null;
  return rows[0].revoked_at;
}

/**
 * Отзывает конкретную сессию по хешу ключа сессии.
 */
export async function revokeAuthSession(
  sessionKeyHash: string,
  expiresAt: Date,
  executor: PrismaSqlExecutor = prisma
): Promise<void> {
  if (
    !/^[a-f0-9]{64}$/.test(sessionKeyHash) ||
    !Number.isFinite(expiresAt.getTime())
  ) {
    throw new Error("Invalid auth session revocation data");
  }

  await executor.$executeRawUnsafe(
    `DELETE FROM auth_revoked_sessions WHERE expires_at <= NOW()`
  );

  await executor.$executeRawUnsafe(
    `
      INSERT INTO auth_revoked_sessions (session_key_hash, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (session_key_hash)
      DO UPDATE SET expires_at = GREATEST(auth_revoked_sessions.expires_at, EXCLUDED.expires_at)
    `,
    sessionKeyHash,
    expiresAt
  );
}

/**
 * Проверяет, отозвана ли конкретная сессия.
 */
export async function isAuthSessionRevoked(
  sessionKeyHash: string,
  executor: PrismaSqlExecutor = prisma
): Promise<boolean> {
  const rows = await executor.$queryRawUnsafe<{ revoked: boolean }[]>(
    `
      SELECT EXISTS (
        SELECT 1 FROM auth_revoked_sessions
        WHERE session_key_hash = $1 AND expires_at > NOW()
      ) AS revoked
    `,
    sessionKeyHash
  );

  return rows[0]?.revoked === true;
}
