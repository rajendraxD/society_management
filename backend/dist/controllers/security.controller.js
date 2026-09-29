"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const store_js_1 = require("../services/store.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
exports.SecurityController = {
    getGateDashboard: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const [stats, visitors, gateLog, expectedVisitors, alerts, user] = await Promise.all([
            store_js_1.Store.getSecurityStats(),
            store_js_1.Store.getActiveVisitors(),
            store_js_1.Store.getGateLog(),
            store_js_1.Store.getExpectedVisitors(),
            store_js_1.Store.getSecurityAlerts(),
            store_js_1.Store.getUserByRole("security"),
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
    checkInVisitor: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const visitor = await store_js_1.Store.addVisitor(req.body);
        res.status(201).json({
            success: true,
            message: "Visitor entered and notification sent to flat resident",
            data: { visitor },
        });
    }),
    checkOutVisitor: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const result = await store_js_1.Store.markVisitorExit(String(req.params.visitorId));
        if (!result.success) {
            throw new errorHandler_js_1.ApiError(404, result.message);
        }
        res.json({
            success: true,
            message: "Visitor marked exited",
            data: { visitor: result.visitor },
        });
    }),
};
