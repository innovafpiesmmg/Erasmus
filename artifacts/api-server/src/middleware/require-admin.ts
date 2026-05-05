import type { Request, Response, NextFunction } from "express";
import { getSession } from "../routes/auth.js";

export interface AdminLocals {
  username: string;
  partnerId: number | null;
}

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

  res.locals.admin = {
    username: session.username,
    partnerId: session.partnerId ?? null,
  } satisfies AdminLocals;

  next();
}

/**
 * Helper to get the scoped partnerId from any request (authenticated or not).
 * Returns null if unauthenticated or if the admin has no partner restriction.
 */
export async function getPartnerIdFromRequest(req: Request): Promise<number | null> {
  const sessionId = req.cookies["sessionId"];
  if (!sessionId) return null;
  const session = await getSession(sessionId);
  return session?.partnerId ?? null;
}

/**
 * Helper to read the admin locals set by requireAdmin.
 */
export function getAdminLocals(res: Response): AdminLocals {
  return (res.locals.admin as AdminLocals) ?? { username: "", partnerId: null };
}
