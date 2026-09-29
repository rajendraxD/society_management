import { Request, Response } from "express";
import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { DEMO_RESIDENT_FLAT } from "../seed/seedData.js";

export const ResidentController = {
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const flatNumber = DEMO_RESIDENT_FLAT;
    const [bills, notices, visitors, familyMembers, vehicles, user] =
      await Promise.all([
        Store.getResidentBills(flatNumber),
        Store.getNotices(),
        Store.getVisitors(),
        Store.getFamilyMembers(),
        Store.getVehicles(),
        Store.getUserByRole("resident"),
      ]);

    const currentBill =
      bills.find((b) => b.status !== "paid") || bills[0] || null;

    res.json({
      success: true,
      message: "Resident dashboard fetched successfully",
      data: {
        flatNumber,
        wing: "A",
        tower: user.tower,
        floor: user.floor,
        ownership: user.ownership,
        residentName: user.name,
        email: user.email,
        currentBill,
        allBills: bills,
        notices,
        recentVisitors: visitors.filter((v) => v.destinationFlat === flatNumber),
        familyMembers,
        vehicles,
      },
    });
  }),

  getBills: asyncHandler(async (_req: Request, res: Response) => {
    const flatNumber = DEMO_RESIDENT_FLAT;
    const bills = await Store.getResidentBills(flatNumber);
    const outstanding = bills
      .filter((b) => b.status !== "paid")
      .reduce((sum, b) => sum + b.amount, 0);

    res.json({
      success: true,
      message: "Bills fetched successfully",
      data: { flatNumber, outstanding, bills },
    });
  }),

  payBill: asyncHandler(async (req: Request, res: Response) => {
    const { flatNumber, transactionRef } = req.body;
    const result = await Store.payBill(flatNumber, transactionRef);

    if (!result.success) {
      throw new ApiError(404, result.message);
    }

    res.json({
      success: true,
      message: "Payment processed successfully",
      data: { bill: result.bill },
    });
  }),

  preApproveVisitor: asyncHandler(async (req: Request, res: Response) => {
    const visitor = await Store.addVisitor({
      ...req.body,
      destinationFlat: req.body.destinationFlat || DEMO_RESIDENT_FLAT,
      // Pre-approval grants a gate pass; the visitor is not inside until the
      // guard registers them at the gate.
      status: "Expected",
      purpose: req.body.purpose || "Resident pre-approval",
    });

    res.status(201).json({
      success: true,
      message: "Visitor pre-approved successfully",
      data: { visitor },
    });
  }),
};
