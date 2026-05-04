import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db/schema";
import { eq, lt } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// SECURE_COOKIES=true → Secure flag on cookie (requires HTTPS, e.g. Cloudflare Tunnel)
// SECURE_COOKIES=false → no Secure flag (plain HTTP deployments)
// If not set, defaults to true in production, false in development
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

// ADMIN_SESSION_TTL_SECONDS configures how long admin sessions last.
// Must be a positive integer. Defaults to 86400 (24 hours) if not set or invalid.
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

export async function getSession(
  sessionId: string,
): Promise<{ authenticated: boolean; username: string } | null> {
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
  return { authenticated: true, username: session.username };
}

const router: IRouter = Router();

router.post("/admin/login", async (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessionsTable).values({ id: sessionId, username, expiresAt });

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
    res.json({ authenticated: true, username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
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
    res.json({ authenticated: true, username: session.username });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
