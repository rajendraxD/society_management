"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorIdParamSchema = exports.nocIdParamSchema = exports.updateNOCSchema = exports.payBillSchema = exports.preApproveVisitorSchema = exports.checkInVisitorSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const Visitor_js_1 = require("../models/Visitor.js");
const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
/** Society flat numbers look like "A-404" / "C-1102". */
const flatRegex = /^[A-Z]-\d{1,4}$/i;
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address")
        .max(160),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").max(128),
    /** Only used to reject a login against the wrong role screen — never to authorise. */
    role: zod_1.z.enum(["admin", "resident", "security", "committee"]).optional(),
    authType: zod_1.z.enum(["password", "biometric", "qr"]).optional(),
});
exports.checkInVisitorSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Visitor name must be at least 2 characters"),
    phone: zod_1.z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
    visitorType: zod_1.z.enum(Visitor_js_1.VISITOR_TYPES).default("Guest"),
    destinationFlat: zod_1.z
        .string()
        .trim()
        .regex(flatRegex, "Flat must look like A-404"),
    vehicleNumber: zod_1.z.string().trim().max(20).optional(),
    otpCode: zod_1.z
        .string()
        .trim()
        .regex(/^\d{4}$/, "OTP must be 4 digits")
        .optional(),
    purpose: zod_1.z.string().trim().max(200).optional(),
});
exports.preApproveVisitorSchema = exports.checkInVisitorSchema.omit({ otpCode: true });
exports.payBillSchema = zod_1.z.object({
    flatNumber: zod_1.z
        .string()
        .trim()
        .regex(flatRegex, "Flat must look like A-404"),
    transactionRef: zod_1.z.string().trim().max(60).optional(),
});
exports.updateNOCSchema = zod_1.z.object({
    status: zod_1.z.enum(["Approved", "Rejected"]),
    reason: zod_1.z.string().trim().max(300).optional(),
});
exports.nocIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1, "NOC id is required"),
});
exports.visitorIdParamSchema = zod_1.z.object({
    visitorId: zod_1.z.string().trim().min(1, "Visitor id is required"),
});
