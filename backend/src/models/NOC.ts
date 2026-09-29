import mongoose, { Document, Schema } from "mongoose";

/** NOC categories offered to residents — kept in sync with the Committee screen. */
export const NOC_TYPES = [
  "Property Sale",
  "Bank Loan",
  "Passport",
  "Rental",
  "Gas Connection",
  "Electricity",
  "Business License",
  "Society Transfer",
] as const;

export type NOCType = (typeof NOC_TYPES)[number];

export interface INOC extends Document {
  applicantName: string;
  flatNumber: string;
  nocType: NOCType;
  reason: string;
  appliedDate: Date;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  reviewedDate?: Date;
  rejectionReason?: string;
  documents: string[];
}

const NOCSchema = new Schema<INOC>(
  {
    applicantName: { type: String, required: true },
    flatNumber: { type: String, required: true },
    nocType: {
      type: String,
      enum: NOC_TYPES,
      required: true,
    },
    reason: { type: String, required: true },
    appliedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: { type: String },
    reviewedDate: { type: Date },
    rejectionReason: { type: String },
    documents: [{ type: String }],
  },
  { timestamps: true }
);

export const NOC = mongoose.model<INOC>("NOC", NOCSchema);
