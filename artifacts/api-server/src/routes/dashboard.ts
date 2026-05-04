import { Router, type IRouter } from "express";
import { db, partnersTable, mobilitiesTable, activitiesTable, mediaTable } from "@workspace/db";
import { sql, eq, gte, lt, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [partnersCount, mobilitiesCount, activitiesCount, mediaCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(partnersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(mobilitiesTable),
      db.select({ count: sql<number>`count(*)::int` }).from(activitiesTable),
      db.select({ count: sql<number>`count(*)::int` }).from(mediaTable),
    ]);

    const upcomingCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mobilitiesTable)
      .where(gte(mobilitiesTable.startDate, today));

    const pastCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(mobilitiesTable)
      .where(lt(mobilitiesTable.startDate, today));

    res.json({
      totalPartners: partnersCount[0]?.count ?? 0,
      totalMobilities: mobilitiesCount[0]?.count ?? 0,
      totalActivities: activitiesCount[0]?.count ?? 0,
      totalMedia: mediaCount[0]?.count ?? 0,
      upcomingCount: upcomingCount[0]?.count ?? 0,
      pastCount: pastCount[0]?.count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

router.get("/dashboard/upcoming-mobilities", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const today = new Date().toISOString().split("T")[0];

    const mobilities = await db
      .select()
      .from(mobilitiesTable)
      .where(gte(mobilitiesTable.startDate, today))
      .orderBy(asc(mobilitiesTable.startDate))
      .limit(limit);

    const allPartners = await db.select().from(partnersTable);
    const partnerMap = Object.fromEntries(allPartners.map((p) => [p.id, p]));

    const result = mobilities.map((m) => ({ ...m, partner: partnerMap[m.partnerId] }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming mobilities" });
  }
});

export default router;
