import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", AdminController.getDashboardData);
router.get("/modules", AdminController.getModules);
router.get("/reports", AdminController.getReports);

export default router;
