import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database baselining...");

  // 1. Create _prisma_migrations table if it doesn't exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
  console.log("Ensure _prisma_migrations table exists.");

  // 2. Read migration file and calculate checksum
  const migrationFolder = "0_init";
  const sqlPath = path.join(process.cwd(), "prisma", "migrations", migrationFolder, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Migration file not found at ${sqlPath}`);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf-8");
  const checksum = crypto.createHash("sha256").update(sqlContent).digest("hex");
  console.log(`Migration checksum calculated: ${checksum}`);

  // 3. Check if already inserted
  const existing: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = $1`,
    migrationFolder
  );

  if (existing.length > 0) {
    console.log(`Migration ${migrationFolder} is already marked as applied.`);
  } else {
    // 4. Insert row
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        '${id}',
        '${checksum}',
        '${now}',
        '${migrationFolder}',
        NULL,
        NULL,
        '${now}',
        1
      )
    `);
    console.log(`Successfully marked migration ${migrationFolder} as applied in DB.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
