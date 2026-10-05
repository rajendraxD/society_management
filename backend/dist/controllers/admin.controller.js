import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
export const AdminController = {
    getDashboardData: asyncHandler(async (_req, res) => {
        const [society, kpis, monthlyCollection, expenseBreakdown, alerts, defaulters] = await Promise.all([
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
    /** Every complaint in the society, newest first. */
    getComplaints: asyncHandler(async (_req, res) => {
        const complaints = await Store.getComplaints();
        res.json({
            success: true,
            message: "Complaints fetched successfully",
            data: {
                complaints,
                summary: {
                    open: complaints.filter((c) => c.status === "Open").length,
                    inProgress: complaints.filter((c) => c.status === "In Progress").length,
                    resolved: complaints.filter((c) => c.status === "Resolved").length,
                },
            },
        });
    }),
    updateComplaintStatus: asyncHandler(async (req, res) => {
        const { status, assignedTo } = req.body;
        const result = await Store.updateComplaintStatus(String(req.params.id), status, assignedTo);
        if (!result.success) {
            throw new ApiError(404, result.message);
        }
        res.json({
            success: true,
            message: result.message,
            data: { complaint: result.complaint },
        });
    }),
    getModules: asyncHandler(async (_req, res) => {
        const modules = await Store.getModules();
        res.json({
            success: true,
            message: "Modules fetched successfully",
            data: { modules },
        });
    }),
    getReports: asyncHandler(async (_req, res) => {
        const reports = await Store.getReports();
        res.json({
            success: true,
            message: "Reports fetched successfully",
            data: { reports },
        });
    }),
};
