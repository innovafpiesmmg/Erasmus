import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminsTable, sessionsTable } from "@workspace/db/schema";
import { logger } from "./logger.js";

/**
 * Reset (or create) the env-defined admin user in the database.
 *
 * Use this when:
 *   - the ADMIN_PASSWORD env var was changed after initial install
 *     (the seed function only seeds when the table is empty, so the bcrypt
 *     hash in the DB does not auto-update)
 *   - the admin row was accidentally deleted via the admin UI
 *   - the user forgot their password and edited /etc/sea-erasmus/env
 *
 * Triggered via `sudo sea reset-admin` on the Ubuntu server, which runs
 * `node dist/index.mjs --reset-admin`.
 */
export async function resetAdminFromEnv(): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error(
      "ERROR: ADMIN_USERNAME and ADMIN_PASSWORD must be set in the environment.",
    );
    console.error(
      "       On Ubuntu these live in /etc/sea-erasmus/env. Edit them, then re-run.",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await db
    .update(adminsTable)
    .set({ passwordHash, isSuperAdmin: true, partnerId: null })
    .where(eq(adminsTable.username, username))
    .returning({ id: adminsTable.id });

  let action: "updated" | "created";
  let id: number;

  if (updated.length > 0) {
    action = "updated";
    id = updated[0].id;
  } else {
    const inserted = await db
      .insert(adminsTable)
      .values({ username, passwordHash, isSuperAdmin: true, partnerId: null })
      .returning({ id: adminsTable.id });
    action = "created";
    id = inserted[0].id;
  }

  // Wipe stale sessions so the user is forced to log in fresh with the new
  // password (and any previously-issued session cookie is invalidated).
  const cleared = await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.username, username))
    .returning({ id: sessionsTable.id });

  logger.info(
    { username, id, action, sessionsCleared: cleared.length },
    "Admin reset from env",
  );

  // Friendly stdout output for someone running `sudo sea reset-admin`.
  console.log("");
  console.log(`  Admin "${username}" ${action} successfully (id=${id}).`);
  console.log(`  is_super_admin: true,  partner_id: NULL`);
  console.log(`  Cleared ${cleared.length} stale session(s).`);
  console.log("");
  console.log("  You can now log in at /admin/login with the credentials");
  console.log("  defined in /etc/sea-erasmus/env.");
  console.log("");
}
