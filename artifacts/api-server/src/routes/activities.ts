import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import {
  CreateActivityBody,
  UpdateActivityParams,
  DeleteActivityParams,
  UpdateActivityBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activities", async (_req, res) => {
  try {
    const activities = await db.select().from(activitiesTable).orderBy(activitiesTable.createdAt);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

router.post("/activities", async (req, res) => {
  try {
    const parsed = CreateActivityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const inserted = await db.insert(activitiesTable).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create activity" });
  }
});

router.put("/activities/:id", async (req, res) => {
  try {
    const params = UpdateActivityParams.safeParse({ id: Number(req.params.id) });
    const body = UpdateActivityBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const updated = await db
      .update(activitiesTable)
      .set(body.data)
      .where(eq(activitiesTable.id, params.data.id))
      .returning();
    if (!updated.length) {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update activity" });
  }
});

router.delete("/activities/:id", async (req, res) => {
  try {
    const params = DeleteActivityParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await db.delete(activitiesTable).where(eq(activitiesTable.id, params.data.id));
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

export default router;
