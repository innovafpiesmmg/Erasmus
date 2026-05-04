import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  try {
    let rows = await db.select().from(settingsTable).limit(1);
    if (rows.length === 0) {
      const inserted = await db.insert(settingsTable).values({}).returning();
      rows = inserted;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const body = req.body;
    let rows = await db.select().from(settingsTable).limit(1);
    if (rows.length === 0) {
      const inserted = await db.insert(settingsTable).values(body).returning();
      res.json(inserted[0]);
      return;
    }
    const updated = await db
      .update(settingsTable)
      .set({ ...body, updatedAt: new Date() })
      .returning();
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
