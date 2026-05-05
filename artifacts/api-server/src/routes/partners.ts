import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, partnersTable, mobilitiesTable } from "@workspace/db";
import { CreatePartnerBody, GetPartnerParams, UpdatePartnerParams, DeletePartnerParams, UpdatePartnerBody } from "@workspace/api-zod";
import { getAdminLocals, getPartnerIdFromRequest } from "../middleware/require-admin.js";

const router: IRouter = Router();

router.get("/partners", async (req, res) => {
  try {
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    const partners = scopedPartnerId != null
      ? await db.select().from(partnersTable).where(eq(partnersTable.id, scopedPartnerId))
      : await db.select().from(partnersTable).orderBy(partnersTable.id);
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

router.post("/partners", async (req, res) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para crear socios" });
    return;
  }
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
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    if (scopedPartnerId != null && scopedPartnerId !== params.data.id) {
      res.status(403).json({ error: "No tienes acceso a este socio" });
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
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  const targetId = Number(req.params.id);
  if (adminPartnerId != null && adminPartnerId !== targetId) {
    res.status(403).json({ error: "Solo puedes editar tu propio centro" });
    return;
  }
  try {
    const params = UpdatePartnerParams.safeParse({ id: targetId });
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
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para eliminar socios" });
    return;
  }
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
