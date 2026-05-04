import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required. " +
    "Set them in the Replit Secrets panel before starting the server.",
  );
}

export type SessionData = { authenticated: boolean; username: string };
export const SESSION_STORE: Map<string, SessionData> = new Map();

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const router: IRouter = Router();

router.post("/admin/login", (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = crypto.randomUUID();
    SESSION_STORE.set(sessionId, { authenticated: true, username });
    const cookieFlags = [
      `sessionId=${sessionId}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      IS_PRODUCTION ? "Secure" : "",
      "Max-Age=86400",
    ]
      .filter(Boolean)
      .join("; ");
    res.setHeader("Set-Cookie", cookieFlags);
    res.json({ authenticated: true, username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/admin/logout", (req: Request, res: Response) => {
  const sessionId = req.cookies["sessionId"];
  if (sessionId) {
    SESSION_STORE.delete(sessionId);
  }
  res.setHeader("Set-Cookie", "sessionId=; Path=/; Max-Age=0");
  res.json({ message: "Logged out successfully" });
});

router.get("/admin/me", (req: Request, res: Response) => {
  const sessionId = req.cookies["sessionId"];
  const session = sessionId ? SESSION_STORE.get(sessionId) : null;
  if (session?.authenticated) {
    res.json({ authenticated: true, username: session.username });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
