import { z } from "zod";
import { VISITOR_TYPES } from "../models/Visitor.js";
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES, } from "../models/Complaint.js";
import { isDbConnected } from "../config/db.js";
const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
/** Society flat numbers look like "A-404" / "C-1102". */
const flatRegex = /^[A-Z]-\d{1,4}$/i;
/**
 * Row id: a 24-char Mongo ObjectId, or a prefixed demo id like `vis-1` minted
 * by the in-memory store when MongoDB is unreachable.
 *
 * Validating this at the edge keeps Mongoose CastErrors — which would otherwise
 * surface as a 500 — out of every `:id` route, while still letting the
 * database-less demo check a visitor out. Anything with no prefix or a malformed
 * one (`not-an-id`, `../../etc`) still fails here as a 400.
 */
const rowId = z.string().trim().superRefine((value, ctx) => {
    const objectId = /^[a-f\d]{24}$/i.test(value);
    const demoId = /^(noc-\d+|vis-[\w-]+)$/i.test(value);
    // A demo id only means something while there is no database. Once Mongo is
    // connected, accepting one would let it reach `findById` and come back as a
    // CastError — a 500 where a 400 belongs.
    if (!objectId && !(demoId && !isDbConnected())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid id" });
    }
});
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address")
        .max(160),
    password: z.string().min(6, "Password must be at least 6 characters").max(128),
    /** Only used to reject a login against the wrong role screen — never to authorise. */
    role: z.enum(["admin", "resident", "security", "committee"]).optional(),
    authType: z.enum(["password", "biometric", "qr"]).optional(),
});
export const checkInVisitorSchema = z.object({
    name: z.string().trim().min(2, "Visitor name must be at least 2 characters"),
    phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
    visitorType: z.enum(VISITOR_TYPES).default("Guest"),
    destinationFlat: z
        .string()
        .trim()
        .regex(flatRegex, "Flat must look like A-404"),
    vehicleNumber: z.string().trim().max(20).optional(),
    otpCode: z
        .string()
        .trim()
        .regex(/^\d{4}$/, "OTP must be 4 digits")
        .optional(),
    purpose: z.string().trim().max(200).optional(),
});
export const preApproveVisitorSchema = checkInVisitorSchema.omit({ otpCode: true });
export const payBillSchema = z.object({
    /**
     * Accepted for shape only — the controller bills the caller's own flat from
     * the token. Kept so existing clients do not 400 on an unexpected key.
     */
    flatNumber: z
        .string()
        .trim()
        .regex(flatRegex, "Flat must look like A-404"),
    transactionRef: z.string().trim().max(60).optional(),
});
export const updateNOCSchema = z.object({
    status: z.enum(["Approved", "Rejected"]),
    reason: z.string().trim().max(300).optional(),
});
export const nocIdParamSchema = z.object({
    id: rowId,
});
export const visitorIdParamSchema = z.object({
    visitorId: rowId,
});
export const createComplaintSchema = z.object({
    title: z.string().trim().min(4, "Title must be at least 4 characters").max(120),
    category: z.enum(COMPLAINT_CATEGORIES).default("Other"),
    description: z
        .string()
        .trim()
        .min(10, "Describe the issue in at least 10 characters")
        .max(1000),
    priority: z.enum(COMPLAINT_PRIORITIES).default("Medium"),
});
export const updateComplaintSchema = z.object({
    status: z.enum(COMPLAINT_STATUSES),
    assignedTo: z.string().trim().max(120).optional(),
});
export const complaintIdParamSchema = z.object({
    // ObjectId with MongoDB, `cmp-…` from the in-memory demo store.
    id: z
        .string()
        .trim()
        .superRefine((value, ctx) => {
        const objectId = /^[a-f\d]{24}$/i.test(value);
        const demoId = /^cmp-[\w-]+$/i.test(value);
        if (!objectId && !(demoId && !isDbConnected())) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid id" });
        }
    }),
});
