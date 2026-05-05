import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { getSession } from "./auth.js";
import { getAdminLocals } from "../middleware/require-admin.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

async function getRequestingAdmin(req: Request) {
  const sessionId = req.cookies["sessionId"];
  if (!sessionId) return null;
  return getSession(sessionId);
}

router.get("/admin/users", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para gestionar administradores" });
    return;
  }
  try {
    const admins = await db
      .select({
        id: adminsTable.id,
        username: adminsTable.username,
        isSuperAdmin: adminsTable.isSuperAdmin,
        partnerId: adminsTable.partnerId,
        createdAt: adminsTable.createdAt,
      })
      .from(adminsTable)
      .orderBy(adminsTable.createdAt);
    res.json(admins);
  } catch (err) {
    logger.error({ err }, "Failed to list admins");
    res.status(500).json({ error: "Error al obtener administradores" });
  }
});

router.post("/admin/users", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para crear administradores" });
    return;
  }
  const { username, password, partnerId } = req.body as { username?: string; password?: string; partnerId?: number | null };
  if (!username || !password || username.trim().length < 3 || password.length < 6) {
    res.status(400).json({ error: "Usuario (mín. 3 caracteres) y contraseña (mín. 6 caracteres) requeridos" });
    return;
  }
  try {
    const existing = await db
      .select({ id: adminsTable.id })
      .from(adminsTable)
      .where(eq(adminsTable.username, username.trim()))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Ya existe un administrador con ese nombre de usuario" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await db
      .insert(adminsTable)
      .values({
        username: username.trim(),
        passwordHash,
        isSuperAdmin: false,
        partnerId: partnerId ?? null,
      })
      .returning({
        id: adminsTable.id,
        username: adminsTable.username,
        isSuperAdmin: adminsTable.isSuperAdmin,
        partnerId: adminsTable.partnerId,
        createdAt: adminsTable.createdAt,
      });
    res.status(201).json(inserted[0]);
  } catch (err) {
    logger.error({ err }, "Failed to create admin");
    res.status(500).json({ error: "Error al crear administrador" });
  }
});

router.put("/admin/users/:id/password", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para cambiar contraseñas" });
    return;
  }
  const id = Number(req.params.id);
  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }
  try {
    const target = await db
      .select({ id: adminsTable.id, username: adminsTable.username })
      .from(adminsTable)
      .where(eq(adminsTable.id, id))
      .limit(1);
    if (!target.length) {
      res.status(404).json({ error: "Administrador no encontrado" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(adminsTable).set({ passwordHash }).where(eq(adminsTable.id, id));
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    logger.error({ err }, "Failed to update admin password");
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  const { partnerId: adminPartnerId } = getAdminLocals(res);
  if (adminPartnerId != null) {
    res.status(403).json({ error: "No tienes permisos para eliminar administradores" });
    return;
  }
  const id = Number(req.params.id);
  try {
    const requesting = await getRequestingAdmin(req);
    const target = await db
      .select({ id: adminsTable.id, username: adminsTable.username, isSuperAdmin: adminsTable.isSuperAdmin })
      .from(adminsTable)
      .where(eq(adminsTable.id, id))
      .limit(1);
    if (!target.length) {
      res.status(404).json({ error: "Administrador no encontrado" });
      return;
    }
    if (target[0].isSuperAdmin) {
      res.status(403).json({ error: "No se puede eliminar al superadministrador" });
      return;
    }
    if (requesting?.username === target[0].username) {
      res.status(403).json({ error: "No puedes eliminar tu propia cuenta" });
      return;
    }
    const remaining = await db.select({ id: adminsTable.id }).from(adminsTable).where(ne(adminsTable.id, id));
    if (remaining.length === 0) {
      res.status(403).json({ error: "No puedes eliminar el último administrador" });
      return;
    }
    await db.delete(adminsTable).where(eq(adminsTable.id, id));
    res.json({ message: "Administrador eliminado" });
  } catch (err) {
    logger.error({ err }, "Failed to delete admin");
    res.status(500).json({ error: "Error al eliminar administrador" });
  }
});

export default router;
