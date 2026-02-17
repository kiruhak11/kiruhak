import { prisma } from "./prisma";

let tableEnsured = false;

async function ensureSessionControlTable() {
  if (tableEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS auth_session_controls (
      user_id TEXT PRIMARY KEY,
      revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  tableEnsured = true;
}

export async function revokeAllUserSessions(userId: string) {
  await ensureSessionControlTable();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO auth_session_controls (user_id, revoked_at)
      VALUES ($1, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET revoked_at = EXCLUDED.revoked_at
    `,
    userId
  );
}

export async function getUserSessionsRevokedAt(
  userId: string
): Promise<Date | null> {
  await ensureSessionControlTable();
  const rows = await prisma.$queryRawUnsafe<{ revoked_at: Date }[]>(
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
