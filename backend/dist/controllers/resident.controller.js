"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentController = void 0;
const store_js_1 = require("../services/store.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const seedData_js_1 = require("../seed/seedData.js");
exports.ResidentController = {
    getDashboard: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const flatNumber = seedData_js_1.DEMO_RESIDENT_FLAT;
        const [bills, notices, visitors, familyMembers, vehicles, user] = await Promise.all([
            store_js_1.Store.getResidentBills(flatNumber),
            store_js_1.Store.getNotices(),
            store_js_1.Store.getVisitors(),
            store_js_1.Store.getFamilyMembers(),
            store_js_1.Store.getVehicles(),
            store_js_1.Store.getUserByRole("resident"),
        ]);
        const currentBill = bills.find((b) => b.status !== "paid") || bills[0] || null;
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
    getBills: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const flatNumber = seedData_js_1.DEMO_RESIDENT_FLAT;
        const bills = await store_js_1.Store.getResidentBills(flatNumber);
        const outstanding = bills
            .filter((b) => b.status !== "paid")
            .reduce((sum, b) => sum + b.amount, 0);
        res.json({
            success: true,
            message: "Bills fetched successfully",
            data: { flatNumber, outstanding, bills },
        });
    }),
    payBill: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const { flatNumber, transactionRef } = req.body;
        const result = await store_js_1.Store.payBill(flatNumber, transactionRef);
        if (!result.success) {
            throw new errorHandler_js_1.ApiError(404, result.message);
        }
        res.json({
            success: true,
            message: "Payment processed successfully",
            data: { bill: result.bill },
        });
    }),
    preApproveVisitor: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const visitor = await store_js_1.Store.addVisitor({
            ...req.body,
            destinationFlat: req.body.destinationFlat || seedData_js_1.DEMO_RESIDENT_FLAT,
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
