import { Request, Response } from "express";
import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";

/**
 * The caller's flat, taken from the signed token.
 *
 * This used to be the `DEMO_RESIDENT_FLAT` constant, which meant every
 * resident saw — and could pay — the same flat's bills. A client-supplied flat
 * would be no better, so it comes from the token the server signed.
 */
function callerFlat(req: Request): string {
  const flatNumber = req.user?.flatNumber;
  if (!flatNumber) {
    throw new ApiError(403, "This account is not linked to a flat");
  }
  return flatNumber;
}

export const ResidentController = {
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const flatNumber = callerFlat(req);
    const [bills, notices, visitors, familyMembers, vehicles, account] =
      await Promise.all([
        Store.getResidentBills(flatNumber),
        Store.getNotices(),
        Store.getVisitors(),
        Store.getFamilyMembers(flatNumber),
        Store.getVehicles(flatNumber),
        Store.getUserById(req.user!.id),
      ]);

    // `getUserById` resolves in both the MongoDB and the in-memory mode, so
    // there is no role-based fallback here. Falling back to "any resident"
    // would serve the caller's own flatNumber beside a different resident's
    // name, email and ownership.
    const user = account;
    if (!user) {
      throw new ApiError(404, "Resident profile not found");
    }

    const currentBill =
      bills.find((b) => b.status !== "paid") || bills[0] || null;

    res.json({
      success: true,
      message: "Resident dashboard fetched successfully",
      data: {
        flatNumber,
        wing: user.wing,
        tower: user.tower,
        floor: user.floor,
        ownership: user.ownership,
        residentName: user.name,
        email: user.email,
        currentBill,
        allBills: bills,
        notices,
        // Case-insensitive: a guard typing "a-404" at the gate should still show up
        // on the resident's own visitor list.
        recentVisitors: visitors.filter(
          (v) =>
            v.destinationFlat?.toUpperCase() === flatNumber.toUpperCase()
        ),
        familyMembers,
        vehicles,
      },
    });
  }),

  getBills: asyncHandler(async (req: Request, res: Response) => {
    const flatNumber = callerFlat(req);
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
    const { transactionRef } = req.body;
    // The flat in the body is validated for shape only. Ignoring it and
    // paying the caller's own flat is what stops one resident settling
    // another's dues from a tampered request.
    const flatNumber = callerFlat(req);
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
      // A resident can only issue a gate pass to their own flat.
      destinationFlat: callerFlat(req),
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

  /** Complaints the caller has raised. Always the caller's own flat. */
  getComplaints: asyncHandler(async (req: Request, res: Response) => {
    const flatNumber = callerFlat(req);
    const complaints = await Store.getComplaints(flatNumber);

    res.json({
      success: true,
      message: "Complaints fetched successfully",
      data: { complaints },
    });
  }),

  /**
   * Raise a complaint. `flatNumber` and `residentName` are never read from the
   * body — they come from the signed token, so a resident can only file against
   * their own flat and only under their own name.
   */
  createComplaint: asyncHandler(async (req: Request, res: Response) => {
    const flatNumber = callerFlat(req);
    const account = await Store.getUserById(req.user!.id);
    const residentName = account?.name ?? req.user!.email;

    const complaint = await Store.createComplaint({
      ...req.body,
      flatNumber,
      residentName,
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      data: { complaint },
    });
  }),
};
