import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  if (IS_PRODUCTION) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set in production. " +
        "Configure them in the Replit Secrets panel.",
    );
  }
  console.warn(
    "[auth] ADMIN_USERNAME / ADMIN_PASSWORD not set — using dev defaults " +
      "(admin / erasmus2025). Set both secrets before deploying to production.",
  );
}

const effectiveUsername = ADMIN_USERNAME ?? "admin";
const effectivePassword = ADMIN_PASSWORD ?? "erasmus2025";

export type SessionData = { authenticated: boolean; username: string };
export const SESSION_STORE: Map<string, SessionData> = new Map();

const router: IRouter = Router();

router.post("/admin/login", (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username === effectiveUsername && password === effectivePassword) {
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
