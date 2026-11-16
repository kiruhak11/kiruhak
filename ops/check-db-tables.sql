-- K-Studio: schema check for a restored database.
--
-- Run with:
--   psql "$DATABASE_URL" -f ops/check-db-tables.sql
--
-- Two tables are used through raw SQL and are therefore NOT part of the
-- Prisma schema: `prisma db push` does NOT create them. They exist only
-- because of their migrations:
--
--   auth_session_controls        <- 20261009120000_create_auth_session_controls
--   telegram_recovery_challenges  <- 20261009150000_create_telegram_recovery_challenges
--
-- A restored database must contain them, otherwise the session-revocation
-- and the account-recovery flows fail at runtime. Restore the database with
-- `prisma migrate deploy`, never with `prisma db push`.

\echo '--- expected tables ---'

SELECT table_name,
       CASE WHEN table_name IN ('auth_session_controls',
                                'telegram_recovery_challenges',
                                'auth_revoked_sessions',
                                'lead_deliveries')
            THEN 'ok'
            ELSE 'unexpected'
       END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('auth_session_controls',
                     'telegram_recovery_challenges',
                     'auth_revoked_sessions',
                     'lead_deliveries')
ORDER BY table_name;

\echo '--- missing tables (must be empty) ---'

SELECT t.name AS missing_table
FROM (VALUES ('auth_session_controls'),
             ('telegram_recovery_challenges'),
             ('auth_revoked_sessions'),
             ('lead_deliveries')) AS t(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables s
  WHERE s.table_schema = 'public'
    AND s.table_name = t.name
);

\echo '--- migration state ---'

SELECT count(*) AS applied_migrations,
       max(finished_at) AS last_migration
FROM _prisma_migrations
WHERE finished_at IS NOT NULL;
