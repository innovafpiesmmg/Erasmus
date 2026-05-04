import type { Request, Response, NextFunction } from "express";
import { SESSION_STORE } from "../routes/auth.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  const sessionId = cookies?.sessionId;
  const session = sessionId ? SESSION_STORE.get(sessionId) : null;

  if (!session?.authenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  next();
}
