"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const store_js_1 = require("../services/store.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.AdminController = {
    getDashboardData: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const [society, kpis, monthlyCollection, expenseBreakdown, alerts, defaulters] = await Promise.all([
            store_js_1.Store.getSociety(),
            store_js_1.Store.getAdminKPIs(),
            store_js_1.Store.getMonthlyCollectionChart(),
            store_js_1.Store.getExpenseBreakdown(),
            store_js_1.Store.getRecentAlerts(),
            store_js_1.Store.getDefaulters(),
        ]);
        res.json({
            success: true,
            message: "Admin dashboard fetched successfully",
            data: { society, kpis, monthlyCollection, expenseBreakdown, alerts, defaulters },
        });
    }),
    getModules: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const modules = await store_js_1.Store.getModules();
        res.json({
            success: true,
            message: "Modules fetched successfully",
            count: modules.length,
            modules,
        });
    }),
    getReports: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const reports = await store_js_1.Store.getReports();
        res.json({
            success: true,
            message: "Reports fetched successfully",
            count: reports.length,
            reports,
        });
    }),
};
