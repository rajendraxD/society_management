import { Request, Response } from "express";
import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";

export const SecurityController = {
  getGateDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const [stats, visitors, gateLog, expectedVisitors, alerts, user] =
      await Promise.all([
        Store.getSecurityStats(),
        Store.getActiveVisitors(),
        Store.getGateLog(),
        Store.getExpectedVisitors(),
        Store.getSecurityAlerts(),
        Store.getUserByRole("security"),
      ]);

    res.json({
      success: true,
      message: "Security dashboard fetched successfully",
      data: {
        stats,
        visitors,
        gateLog,
        expectedVisitors,
        alerts,
        gate: "Main Gate",
        guardName: user.name,
        shift: user.shift,
        currentDateText: "Jan 31, 2025",
      },
    });
  }),

  checkInVisitor: asyncHandler(async (req: Request, res: Response) => {
    const visitor = await Store.addVisitor(req.body);

    res.status(201).json({
      success: true,
      message: "Visitor entered and notification sent to flat resident",
      data: { visitor },
    });
  }),

  checkOutVisitor: asyncHandler(async (req: Request, res: Response) => {
    const result = await Store.markVisitorExit(String(req.params.visitorId));

    if (!result.success) {
      throw new ApiError(404, result.message);
    }

    res.json({
      success: true,
      message: "Visitor marked exited",
      data: { visitor: result.visitor },
    });
  }),
};
