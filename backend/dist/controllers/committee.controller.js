"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitteeController = void 0;
const store_js_1 = require("../services/store.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.CommitteeController = {
    getDashboard: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const [pendingNOCs, stats, meetings, snapshot, recentActions, fundBalances, vendorPayments, nocTypes, monthlyCollection, user,] = await Promise.all([
            store_js_1.Store.getPendingNOCs(),
            store_js_1.Store.getCommitteeStats(),
            store_js_1.Store.getMeetings(),
            store_js_1.Store.getMonthlySnapshot(),
            store_js_1.Store.getRecentActions(),
            store_js_1.Store.getFundBalances(),
            store_js_1.Store.getVendorPayments(),
            store_js_1.Store.getNOCTypes(),
            store_js_1.Store.getMonthlyCollectionChart(),
            store_js_1.Store.getUserByRole("committee"),
        ]);
        res.json({
            success: true,
            message: "Committee dashboard fetched successfully",
            data: {
                pendingNOCs,
                stats,
                meetings,
                snapshot,
                recentActions,
                fundBalances,
                vendorPayments,
                nocTypes,
                monthlyCollection,
                memberName: user.name,
                designation: user.designation,
                societyName: "Harmony Heights",
            },
        });
    }),
    updateNOC: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const { status, reason } = req.body;
        const result = await store_js_1.Store.updateNOCStatus(String(req.params.id), status, reason);
        if (!result.success) {
            throw new errorHandler_js_1.ApiError(404, result.message);
        }
        res.json({
            success: true,
            message: `NOC ${status} successfully`,
            data: { noc: result.noc },
        });
    }),
};
