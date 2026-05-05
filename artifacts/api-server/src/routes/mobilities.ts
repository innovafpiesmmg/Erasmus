import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, mobilitiesTable, partnersTable, activitiesTable } from "@workspace/db";
import {
  CreateMobilityBody,
  GetMobilityParams,
  UpdateMobilityParams,
  DeleteMobilityParams,
  UpdateMobilityBody,
} from "@workspace/api-zod";
import { getAdminLocals, getPartnerIdFromRequest } from "../middleware/require-admin.js";

const router: IRouter = Router();

router.get("/mobilities", async (req, res) => {
  try {
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    const rows = scopedPartnerId != null
      ? await db.select().from(mobilitiesTable).where(eq(mobilitiesTable.partnerId, scopedPartnerId)).orderBy(mobilitiesTable.startDate)
      : await db.select().from(mobilitiesTable).orderBy(mobilitiesTable.startDate);

    const allPartners = await db.select().from(partnersTable);
    const partnerMap = Object.fromEntries(allPartners.map((p) => [p.id, p]));
    const result = rows.map((m) => ({ ...m, partner: partnerMap[m.partnerId] }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mobilities" });
  }
});

router.post("/mobilities", async (req, res) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const parsed = CreateMobilityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    if (adminPartnerId != null && parsed.data.partnerId !== adminPartnerId) {
      res.status(403).json({ error: "Solo puedes crear movilidades para tu propio centro" });
      return;
    }
    const inserted = await db.insert(mobilitiesTable).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create mobility" });
  }
});

router.get("/mobilities/:id", async (req, res) => {
  try {
    const params = GetMobilityParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const mobility = await db.select().from(mobilitiesTable).where(eq(mobilitiesTable.id, params.data.id)).limit(1);
    if (!mobility.length) {
      res.status(404).json({ error: "Mobility not found" });
      return;
    }
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    if (scopedPartnerId != null && mobility[0].partnerId !== scopedPartnerId) {
      res.status(403).json({ error: "No tienes acceso a esta movilidad" });
      return;
    }
    const partner = await db.select().from(partnersTable).where(eq(partnersTable.id, mobility[0].partnerId)).limit(1);
    const activities = await db.select().from(activitiesTable).where(eq(activitiesTable.mobilityId, params.data.id));
    res.json({ ...mobility[0], partner: partner[0], activities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mobility" });
  }
});

router.put("/mobilities/:id", async (req, res) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const params = UpdateMobilityParams.safeParse({ id: Number(req.params.id) });
    const body = UpdateMobilityBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (adminPartnerId != null) {
      const existing = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, params.data.id)).limit(1);
      if (!existing.length || existing[0].partnerId !== adminPartnerId) {
        res.status(403).json({ error: "Solo puedes editar movilidades de tu centro" });
        return;
      }
    }
    const updated = await db
      .update(mobilitiesTable)
      .set(body.data)
      .where(eq(mobilitiesTable.id, params.data.id))
      .returning();
    if (!updated.length) {
      res.status(404).json({ error: "Mobility not found" });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update mobility" });
  }
});

router.delete("/mobilities/:id", async (req, res) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const params = DeleteMobilityParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    if (adminPartnerId != null) {
      const existing = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, params.data.id)).limit(1);
      if (!existing.length || existing[0].partnerId !== adminPartnerId) {
        res.status(403).json({ error: "Solo puedes eliminar movilidades de tu centro" });
        return;
      }
    }
    await db.delete(mobilitiesTable).where(eq(mobilitiesTable.id, params.data.id));
    res.json({ message: "Mobility deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete mobility" });
  }
});

export default router;
