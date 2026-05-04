import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import partnersRouter from "./partners";
import mobilitiesRouter from "./mobilities";
import activitiesRouter from "./activities";
import mediaRouter from "./media";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(settingsRouter);
router.use(partnersRouter);
router.use(mobilitiesRouter);
router.use(activitiesRouter);
router.use(mediaRouter);
router.use(dashboardRouter);

export default router;
