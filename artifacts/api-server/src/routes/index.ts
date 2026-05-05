import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import partnersRouter from "./partners";
import mobilitiesRouter from "./mobilities";
import activitiesRouter from "./activities";
import mediaRouter from "./media";
import dashboardRouter from "./dashboard";
import backupRouter from "./backup";
import { requireAdmin } from "../middleware/require-admin.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

// Guard: require auth for all write operations and admin-only reads
router.use(async (req, res, next) => {
  const isAuthPath =
    req.path.startsWith("/admin/login") ||
    req.path.startsWith("/admin/logout") ||
    req.path.startsWith("/admin/me");
  const isDashboardPath = req.path.startsWith("/dashboard");
  if (!isAuthPath && (WRITE_METHODS.has(req.method) || isDashboardPath)) {
    return requireAdmin(req, res, next);
  } else {
    next();
  }
});

router.use(settingsRouter);
router.use(partnersRouter);
router.use(mobilitiesRouter);
router.use(activitiesRouter);
router.use(mediaRouter);
router.use(dashboardRouter);
router.use(backupRouter);

export default router;
