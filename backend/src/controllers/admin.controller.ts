import { Request, Response } from "express";
import { Store } from "../services/store.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const AdminController = {
  getDashboardData: asyncHandler(async (_req: Request, res: Response) => {
    const [society, kpis, monthlyCollection, expenseBreakdown, alerts, defaulters] =
      await Promise.all([
        Store.getSociety(),
        Store.getAdminKPIs(),
        Store.getMonthlyCollectionChart(),
        Store.getExpenseBreakdown(),
        Store.getRecentAlerts(),
        Store.getDefaulters(),
      ]);

    res.json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: { society, kpis, monthlyCollection, expenseBreakdown, alerts, defaulters },
    });
  }),

  getModules: asyncHandler(async (_req: Request, res: Response) => {
    const modules = await Store.getModules();
    res.json({
      success: true,
      message: "Modules fetched successfully",
      count: modules.length,
      modules,
    });
  }),

  getReports: asyncHandler(async (_req: Request, res: Response) => {
    const reports = await Store.getReports();
    res.json({
      success: true,
      message: "Reports fetched successfully",
      count: reports.length,
      reports,
    });
  }),
};
