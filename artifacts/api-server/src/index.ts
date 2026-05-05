import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed.js";
import { resetAdminFromEnv } from "./lib/reset-admin.js";

// One-shot CLI mode: `node dist/index.mjs --reset-admin` rehashes the
// env-defined admin password into the DB and exits without starting the HTTP
// server. Used by `sudo sea reset-admin` on the Ubuntu deployment.
if (process.argv.includes("--reset-admin")) {
  resetAdminFromEnv()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, "Failed to reset admin");
      console.error("ERROR:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
} else {
  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, async (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    await seedIfEmpty();
  });
}
