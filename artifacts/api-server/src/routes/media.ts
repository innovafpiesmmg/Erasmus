import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, mediaTable } from "@workspace/db";
import { CreateMediaBody, DeleteMediaParams } from "@workspace/api-zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  },
});

const router: IRouter = Router();

router.get("/media", async (req: Request, res: Response) => {
  try {
    const mobilityId = req.query.mobilityId ? Number(req.query.mobilityId) : null;
    const media = mobilityId
      ? await db.select().from(mediaTable).where(eq(mediaTable.mobilityId, mobilityId)).orderBy(mediaTable.createdAt)
      : await db.select().from(mediaTable).orderBy(mediaTable.createdAt);
    res.json(media);
  } catch {
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

router.post("/media/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const mediaType = "image";
    const caption = typeof req.body.caption === "string" ? req.body.caption || null : null;
    const mobilityId = req.body.mobilityId ? Number(req.body.mobilityId) : null;

    const inserted = await db
      .insert(mediaTable)
      .values({ url: fileUrl, mediaType, caption, mobilityId })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.post("/media", async (req, res) => {
  try {
    const parsed = CreateMediaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const inserted = await db.insert(mediaTable).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch {
    res.status(500).json({ error: "Failed to create media" });
  }
});

router.delete("/media/:id", async (req, res) => {
  try {
    const params = DeleteMediaParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [deleted] = await db
      .delete(mediaTable)
      .where(eq(mediaTable.id, params.data.id))
      .returning();
    if (deleted?.url?.startsWith("/uploads/")) {
      const filePath = path.join(UPLOADS_DIR, path.basename(deleted.url));
      fs.unlink(filePath, () => {});
    }
    res.json({ message: "Media deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;
