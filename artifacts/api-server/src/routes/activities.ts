import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, activitiesTable, mobilitiesTable } from "@workspace/db";
import type { Request, Response } from "express";
import {
  CreateActivityBody,
  UpdateActivityParams,
  DeleteActivityParams,
  UpdateActivityBody,
} from "@workspace/api-zod";
import { getAdminLocals, getPartnerIdFromRequest } from "../middleware/require-admin.js";

const router: IRouter = Router();

async function getMobilityIdsForPartner(partnerId: number): Promise<number[]> {
  const rows = await db
    .select({ id: mobilitiesTable.id })
    .from(mobilitiesTable)
    .where(eq(mobilitiesTable.partnerId, partnerId));
  return rows.map((r) => r.id);
}

router.get("/activities", async (req, res) => {
  try {
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    if (scopedPartnerId != null) {
      const mobilityIds = await getMobilityIdsForPartner(scopedPartnerId);
      if (mobilityIds.length === 0) {
        res.json([]);
        return;
      }
      const activities = await db
        .select()
        .from(activitiesTable)
        .where(inArray(activitiesTable.mobilityId, mobilityIds))
        .orderBy(activitiesTable.createdAt);
      res.json(activities);
    } else {
      const activities = await db.select().from(activitiesTable).orderBy(activitiesTable.createdAt);
      res.json(activities);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

router.get("/activities/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [activity] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id)).limit(1);
    if (!activity) {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    const scopedPartnerId = await getPartnerIdFromRequest(req);
    if (scopedPartnerId != null && activity.mobilityId != null) {
      const [mobility] = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, activity.mobilityId)).limit(1);
      if (!mobility || mobility.partnerId !== scopedPartnerId) {
        res.status(403).json({ error: "No tienes acceso a esta actividad" });
        return;
      }
    }
    res.json(activity);
  } catch {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

router.post("/activities", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const parsed = CreateActivityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    if (adminPartnerId != null) {
      if (parsed.data.mobilityId == null) {
        res.status(403).json({ error: "Debes vincular la actividad a una de tus movilidades" });
        return;
      }
      const [mobility] = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, parsed.data.mobilityId)).limit(1);
      if (!mobility || mobility.partnerId !== adminPartnerId) {
        res.status(403).json({ error: "La movilidad no pertenece a tu centro" });
        return;
      }
    }
    const inserted = await db.insert(activitiesTable).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create activity" });
  }
});

router.put("/activities/:id", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const params = UpdateActivityParams.safeParse({ id: Number(req.params.id) });
    const body = UpdateActivityBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (adminPartnerId != null) {
      const [activity] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, params.data.id)).limit(1);
      if (!activity || activity.mobilityId == null) {
        res.status(403).json({ error: "No tienes permiso para editar esta actividad" });
        return;
      }
      const [mobility] = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, activity.mobilityId)).limit(1);
      if (!mobility || mobility.partnerId !== adminPartnerId) {
        res.status(403).json({ error: "Esta actividad no pertenece a tu centro" });
        return;
      }
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

router.delete("/activities/:id", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  try {
    const params = DeleteActivityParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    if (adminPartnerId != null) {
      const [activity] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, params.data.id)).limit(1);
      if (!activity || activity.mobilityId == null) {
        res.status(403).json({ error: "No tienes permiso para eliminar esta actividad" });
        return;
      }
      const [mobility] = await db.select({ partnerId: mobilitiesTable.partnerId }).from(mobilitiesTable).where(eq(mobilitiesTable.id, activity.mobilityId)).limit(1);
      if (!mobility || mobility.partnerId !== adminPartnerId) {
        res.status(403).json({ error: "Esta actividad no pertenece a tu centro" });
        return;
      }
    }
    await db.delete(activitiesTable).where(eq(activitiesTable.id, params.data.id));
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

export default router;
