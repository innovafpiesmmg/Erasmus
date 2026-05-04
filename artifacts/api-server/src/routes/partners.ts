import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, partnersTable, mobilitiesTable } from "@workspace/db";
import { CreatePartnerBody, GetPartnerParams, UpdatePartnerParams, DeletePartnerParams, UpdatePartnerBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/partners", async (_req, res) => {
  try {
    const partners = await db.select().from(partnersTable).orderBy(partnersTable.id);
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

router.post("/partners", async (req, res) => {
  try {
    const parsed = CreatePartnerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const inserted = await db.insert(partnersTable).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create partner" });
  }
});

router.get("/partners/:id", async (req, res) => {
  try {
    const params = GetPartnerParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const partner = await db.select().from(partnersTable).where(eq(partnersTable.id, params.data.id)).limit(1);
    if (!partner.length) {
      res.status(404).json({ error: "Partner not found" });
      return;
    }
    const mobilities = await db.select().from(mobilitiesTable).where(eq(mobilitiesTable.partnerId, params.data.id));
    res.json({ ...partner[0], mobilities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch partner" });
  }
});

router.put("/partners/:id", async (req, res) => {
  try {
    const params = UpdatePartnerParams.safeParse({ id: Number(req.params.id) });
    const body = UpdatePartnerBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const updated = await db
      .update(partnersTable)
      .set(body.data)
      .where(eq(partnersTable.id, params.data.id))
      .returning();
    if (!updated.length) {
      res.status(404).json({ error: "Partner not found" });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update partner" });
  }
});

router.delete("/partners/:id", async (req, res) => {
  try {
    const params = DeletePartnerParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await db.delete(partnersTable).where(eq(partnersTable.id, params.data.id));
    res.json({ message: "Partner deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete partner" });
  }
});

export default router;
