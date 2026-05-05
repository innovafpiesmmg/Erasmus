import { Router, type IRouter } from "express";
import archiver from "archiver";
import unzipper from "unzipper";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sql } from "drizzle-orm";
import { db, settingsTable, partnersTable, mobilitiesTable, activitiesTable, mediaTable } from "@workspace/db";
import { requireAdmin } from "../middleware/require-admin.js";
import { logger } from "../lib/logger.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const router: IRouter = Router();

/** Date columns that come back from JSON as strings and must be revived to Date. */
const DATE_FIELDS: Record<string, readonly string[]> = {
  settings: ["updatedAt"],
  partners: ["createdAt"],
  mobilities: ["createdAt"],
  activities: ["createdAt"],
  media: ["createdAt"],
};

function reviveDates<T extends Record<string, unknown>>(rows: unknown[], table: string): T[] {
  const fields = DATE_FIELDS[table] ?? [];
  return (rows as T[]).map((row) => {
    const out: Record<string, unknown> = { ...row };
    for (const f of fields) {
      const v = out[f];
      if (typeof v === "string") {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) out[f] = d;
      }
    }
    return out as T;
  });
}

router.get("/admin/backup", requireAdmin, async (_req, res) => {
  try {
    const [settings, partners, mobilities, activities, media] = await Promise.all([
      db.select().from(settingsTable),
      db.select().from(partnersTable).orderBy(partnersTable.id),
      db.select().from(mobilitiesTable).orderBy(mobilitiesTable.id),
      db.select().from(activitiesTable).orderBy(activitiesTable.id),
      db.select().from(mediaTable).orderBy(mediaTable.id),
    ]);

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="backup-${date}.zip"`);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => { res.destroy(err); });
    archive.pipe(res);

    const data = { settings, partners, mobilities, activities, media };
    for (const [table, rows] of Object.entries(data)) {
      archive.append(JSON.stringify(rows, null, 2), { name: `data/${table}.json` });
    }

    if (fs.existsSync(UPLOADS_DIR)) {
      archive.directory(UPLOADS_DIR, "uploads");
    }

    await archive.finalize();
  } catch (err) {
    logger.error({ err }, "Backup generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al generar la copia de seguridad" });
    }
  }
});

router.post("/admin/restore", requireAdmin, upload.single("backup"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No se recibió ningún archivo" });
    return;
  }

  try {
    const zip = await unzipper.Open.buffer(req.file.buffer);

    const readJson = async (filename: string): Promise<unknown[]> => {
      const entry = zip.files.find((f) => f.path === `data/${filename}.json`);
      if (!entry) return [];
      const buf = await entry.buffer();
      return JSON.parse(buf.toString("utf-8")) as unknown[];
    };

    const [rawSettings, rawPartners, rawMobilities, rawActivities, rawMedia] = await Promise.all([
      readJson("settings"),
      readJson("partners"),
      readJson("mobilities"),
      readJson("activities"),
      readJson("media"),
    ]);

    const settings = reviveDates(rawSettings, "settings");
    const partners = reviveDates(rawPartners, "partners");
    const mobilities = reviveDates(rawMobilities, "mobilities");
    const activities = reviveDates(rawActivities, "activities");
    const media = reviveDates(rawMedia, "media");

    await db.transaction(async (tx) => {
      // Children first → parents last (FK order)
      await tx.delete(mediaTable);
      await tx.delete(activitiesTable);
      await tx.delete(mobilitiesTable);
      await tx.delete(partnersTable);
      await tx.delete(settingsTable);

      // Parents first → children last
      if (settings.length > 0) await tx.insert(settingsTable).values(settings as typeof settingsTable.$inferInsert[]);
      if (partners.length > 0) await tx.insert(partnersTable).values(partners as typeof partnersTable.$inferInsert[]);
      if (mobilities.length > 0) await tx.insert(mobilitiesTable).values(mobilities as typeof mobilitiesTable.$inferInsert[]);
      if (activities.length > 0) await tx.insert(activitiesTable).values(activities as typeof activitiesTable.$inferInsert[]);
      if (media.length > 0) await tx.insert(mediaTable).values(media as typeof mediaTable.$inferInsert[]);

      // Resync sequences so subsequent INSERTs don't collide with restored IDs.
      // Without this, the next created partner/mobility/etc. would reuse an
      // existing ID and crash with a UNIQUE-violation.
      for (const table of ["settings", "partners", "mobilities", "activities", "media"]) {
        await tx.execute(sql.raw(
          `SELECT setval(
             pg_get_serial_sequence('${table}', 'id'),
             COALESCE((SELECT MAX(id) FROM ${table}), 1),
             (SELECT MAX(id) IS NOT NULL FROM ${table})
           )`,
        ));
      }
    });

    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    const uploadFiles = zip.files.filter((f) => f.path.startsWith("uploads/") && !f.path.endsWith("/") && f.type === "File");
    await Promise.all(
      uploadFiles.map(async (f) => {
        const dest = path.join(UPLOADS_DIR, path.basename(f.path));
        const buf = await f.buffer();
        fs.writeFileSync(dest, buf);
      }),
    );

    logger.info(
      { settings: settings.length, partners: partners.length, mobilities: mobilities.length, activities: activities.length, media: media.length, files: uploadFiles.length },
      "Restore completed",
    );

    res.json({ message: "Restauración completada correctamente" });
  } catch (err) {
    logger.error({ err }, "Restore failed");
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Error al restaurar la copia de seguridad", detail: message });
  }
});

export default router;
