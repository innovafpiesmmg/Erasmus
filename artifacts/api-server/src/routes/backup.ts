import { Router, type IRouter } from "express";
import archiver from "archiver";
import unzipper from "unzipper";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, settingsTable, partnersTable, mobilitiesTable, activitiesTable, mediaTable } from "@workspace/db";
import { requireAdmin } from "../middleware/require-admin.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const router: IRouter = Router();

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

    const [settings, partners, mobilities, activities, media] = await Promise.all([
      readJson("settings"),
      readJson("partners"),
      readJson("mobilities"),
      readJson("activities"),
      readJson("media"),
    ]);

    await db.transaction(async (tx) => {
      await tx.delete(mediaTable);
      await tx.delete(activitiesTable);
      await tx.delete(mobilitiesTable);
      await tx.delete(partnersTable);
      await tx.delete(settingsTable);

      if (settings.length > 0) await tx.insert(settingsTable).values(settings as typeof settingsTable.$inferInsert[]);
      if (partners.length > 0) await tx.insert(partnersTable).values(partners as typeof partnersTable.$inferInsert[]);
      if (mobilities.length > 0) await tx.insert(mobilitiesTable).values(mobilities as typeof mobilitiesTable.$inferInsert[]);
      if (activities.length > 0) await tx.insert(activitiesTable).values(activities as typeof activitiesTable.$inferInsert[]);
      if (media.length > 0) await tx.insert(mediaTable).values(media as typeof mediaTable.$inferInsert[]);
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

    res.json({ message: "Restauración completada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al restaurar la copia de seguridad" });
  }
});

export default router;
