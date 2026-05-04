import type { Request, Response, NextFunction } from "express";
import { getSession } from "../routes/auth.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.cookies["sessionId"];
  const session = sessionId ? await getSession(sessionId) : null;

  if (!session?.authenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  next();
}
