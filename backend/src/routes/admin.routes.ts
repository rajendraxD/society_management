import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  complaintIdParamSchema,
  updateComplaintSchema,
} from "../validations/society.validations.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", AdminController.getDashboardData);
router.get("/modules", AdminController.getModules);
router.get("/reports", AdminController.getReports);
router.get("/complaints", AdminController.getComplaints);
router.post(
  "/complaints/:id/status",
  validate(complaintIdParamSchema, "params"),
  validate(updateComplaintSchema),
  AdminController.updateComplaintStatus
);

export default router;
