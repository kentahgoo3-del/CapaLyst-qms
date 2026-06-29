import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import deviationsRouter from "./deviations";
import capaRouter from "./capa";
import changeControlRouter from "./changecontrol";
import usersRouter from "./users";
import authRouter from "./auth";
import auditRouter from "./audit";
import attachmentsRouter from "./attachments";
import settingsRouter from "./settings";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(dashboardRouter);
router.use(deviationsRouter);
router.use(capaRouter);
router.use(changeControlRouter);
router.use(usersRouter);
router.use(auditRouter);
router.use(attachmentsRouter);
router.use(settingsRouter);
router.use(notificationsRouter);

export default router;
