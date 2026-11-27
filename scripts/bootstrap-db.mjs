import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const schema = fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url));
const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const dataMigration = "20261008120000_reclassify_client_projects";
const expectedChecksum = "5c2635536dded9d462f5fb732b107171c0158b656988f9b70bb2fa8a5a9e73e5";

function migrate(...args) {
  execFileSync(process.execPath, [prismaCli, "migrate", ...args, "--schema", schema], { stdio: "inherit" });
}

async function bootstrap() {
  const connection = process.env.DATABASE_URL;
  if (!connection) {
    throw new Error("Set DATABASE_URL explicitly to the new PostgreSQL database.");
  }
  const url = new URL(connection);
  if (!["postgresql:", "postgres:"].includes(url.protocol) ||
    (url.searchParams.get("schema") ?? "public") !== "public") {
    throw new Error("The bootstrap target must be a PostgreSQL database using schema public.");
  }

  const migration = readFileSync(new URL(`../prisma/migrations/${dataMigration}/migration.sql`, import.meta.url));
  if (createHash("sha256").update(migration).digest("hex") !== expectedChecksum) {
    throw new Error("The approved data-only migration checksum does not match.");
  }

  const client = new PrismaClient({ datasourceUrl: connection });
  try {
    const [state] = await client.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_class AS obj JOIN pg_namespace AS ns ON ns.oid = obj.relnamespace
        WHERE ns.nspname = 'public'
        UNION ALL
        SELECT 1 FROM pg_proc AS obj JOIN pg_namespace AS ns ON ns.oid = obj.pronamespace
        WHERE ns.nspname = 'public'
        UNION ALL
        SELECT 1 FROM pg_type AS obj JOIN pg_namespace AS ns ON ns.oid = obj.typnamespace
        WHERE ns.nspname = 'public'
      ) AS occupied
    `;
    if (state.occupied) {
      throw new Error("Bootstrap requires an empty public schema. For a restored database use npm run db:migrate.");
    }
  } finally {
    await client.$disconnect();
  }

  // Empty databases have no projects to reclassify. Preserve its ledger entry
  // and original checksum, then let Prisma apply every schema migration.
  migrate("resolve", "--applied", dataMigration);
  migrate("deploy");
  migrate("status");
}

bootstrap().catch(error => {
  console.error(error instanceof Error ? error.message : "Database bootstrap failed.");
  process.exitCode = 1;
});
