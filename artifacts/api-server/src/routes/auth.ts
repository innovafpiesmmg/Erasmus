import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { sessionsTable, adminsTable } from "@workspace/db/schema";
import { eq, lt } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const SECURE_COOKIES =
  process.env.SECURE_COOKIES === "true" ||
  (IS_PRODUCTION && process.env.SECURE_COOKIES !== "false");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_USERNAME and ADMIN_PASSWORD must be set. " +
      "Configure them in the Replit Secrets panel before starting the server.",
  );
}

const DEFAULT_SESSION_TTL_SECONDS = 86400;
const parsedTTL = parseInt(process.env.ADMIN_SESSION_TTL_SECONDS ?? "", 10);
const SESSION_TTL_SECONDS =
  Number.isInteger(parsedTTL) && parsedTTL > 0
    ? parsedTTL
    : DEFAULT_SESSION_TTL_SECONDS;
const SESSION_DURATION_MS = SESSION_TTL_SECONDS * 1000;

async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db.delete(sessionsTable).where(lt(sessionsTable.expiresAt, new Date()));
  } catch (err) {
    logger.warn({ err }, "Failed to clean up expired sessions");
  }
}

async function ensureSeedAdmin(): Promise<void> {
  try {
    const existing = await db.select({ id: adminsTable.id }).from(adminsTable).limit(1);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
      await db.insert(adminsTable).values({
        username: ADMIN_USERNAME!,
        passwordHash,
        isSuperAdmin: true,
        partnerId: null,
      });
      logger.info({ username: ADMIN_USERNAME }, "Seeded initial superadmin from env vars");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to seed initial admin");
  }
}

export async function getSession(
  sessionId: string,
): Promise<{ authenticated: boolean; username: string; partnerId: number | null } | null> {
  const rows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  const session = rows[0];
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return null;
  }

  const adminRows = await db
    .select({ partnerId: adminsTable.partnerId })
    .from(adminsTable)
    .where(eq(adminsTable.username, session.username))
    .limit(1);

  const partnerId = adminRows[0]?.partnerId ?? null;
  return { authenticated: true, username: session.username, partnerId };
}

const router: IRouter = Router();

router.post("/admin/login", async (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;

  await ensureSeedAdmin();

  try {
    const rows = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, username))
      .limit(1);

    const admin = rows[0];
    const valid = admin ? await bcrypt.compare(password, admin.passwordHash) : false;

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db.insert(sessionsTable).values({ id: sessionId, username: admin.username, expiresAt });
    cleanupExpiredSessions();

    const cookieFlags = [
      `sessionId=${sessionId}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      SECURE_COOKIES ? "Secure" : "",
      `Max-Age=${SESSION_TTL_SECONDS}`,
    ]
      .filter(Boolean)
      .join("; ");
    res.setHeader("Set-Cookie", cookieFlags);
    res.json({ authenticated: true, username: admin.username, partnerId: admin.partnerId ?? null });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/admin/logout", async (req: Request, res: Response) => {
  const sessionId = req.cookies["sessionId"];
  if (sessionId) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }
  res.setHeader("Set-Cookie", "sessionId=; Path=/; Max-Age=0");
  res.json({ message: "Logged out successfully" });
});

router.get("/admin/me", async (req: Request, res: Response) => {
  const sessionId = req.cookies["sessionId"];
  const session = sessionId ? await getSession(sessionId) : null;
  if (session?.authenticated) {
    res.json({ authenticated: true, username: session.username, partnerId: session.partnerId ?? null });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
