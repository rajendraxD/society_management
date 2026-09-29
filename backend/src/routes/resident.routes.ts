import { Router } from "express";
import { ResidentController } from "../controllers/resident.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  payBillSchema,
  preApproveVisitorSchema,
} from "../validations/society.validations.js";

const router = Router();

router.use(requireAuth, requireRole("resident"));

router.get("/dashboard", ResidentController.getDashboard);
router.get("/bills", ResidentController.getBills);
router.post("/pay-bill", validate(payBillSchema), ResidentController.payBill);
router.post(
  "/pre-approve-visitor",
  validate(preApproveVisitorSchema),
  ResidentController.preApproveVisitor
);

export default router;
