import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "erasmus2025";

export type SessionData = { authenticated: boolean; username: string };
export const SESSION_STORE: Map<string, SessionData> = new Map();

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = crypto.randomUUID();
    SESSION_STORE.set(sessionId, { authenticated: true, username });
    res.setHeader("Set-Cookie", `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
    res.json({ authenticated: true, username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/admin/logout", (req: any, res) => {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    SESSION_STORE.delete(sessionId);
  }
  res.setHeader("Set-Cookie", "sessionId=; Path=/; Max-Age=0");
  res.json({ message: "Logged out successfully" });
});

router.get("/admin/me", (req: any, res) => {
  const sessionId = req.cookies?.sessionId;
  const session = sessionId ? SESSION_STORE.get(sessionId) : null;
  if (session?.authenticated) {
    res.json({ authenticated: true, username: session.username });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
