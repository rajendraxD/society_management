import { z } from "zod";
import { VISITOR_TYPES } from "../models/Visitor.js";

const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
/** Society flat numbers look like "A-404" / "C-1102". */
const flatRegex = /^[A-Z]-\d{1,4}$/i;
/** A 24-char hex string. Rejecting these at the edge keeps Mongoose CastErrors
 *  (which would otherwise surface as a 500) out of every `:id` route. */
const mongoId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

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
  id: mongoId,
});

export const visitorIdParamSchema = z.object({
  visitorId: mongoId,
});
