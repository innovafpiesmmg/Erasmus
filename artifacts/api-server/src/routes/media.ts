import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, mediaTable } from "@workspace/db";
import { CreateMediaBody, DeleteMediaParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/media", async (_req, res) => {
  try {
    const media = await db.select().from(mediaTable).orderBy(mediaTable.createdAt);
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch media" });
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
  } catch (err) {
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
    await db.delete(mediaTable).where(eq(mediaTable.id, params.data.id));
    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;
