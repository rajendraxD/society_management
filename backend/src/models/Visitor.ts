import mongoose, { Document, Schema } from "mongoose";

export const VISITOR_TYPES = [
  "Guest",
  "Delivery",
  "Staff",
  "Vendor",
  "Cab",
  "Other",
] as const;

export type VisitorType = (typeof VISITOR_TYPES)[number];

export interface IVisitor extends Document {
  name: string;
  phone: string;
  visitorType: VisitorType;
  destinationFlat: string;
  vehicleNumber?: string;
  entryGate: string;
  inTime: Date;
  outTime?: Date;
  status: "Expected" | "Inside" | "Exited";
  otpCode: string;
  isVerified: boolean;
  purpose?: string;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    visitorType: {
      type: String,
      enum: VISITOR_TYPES,
      default: "Guest",
    },
    destinationFlat: { type: String, required: true },
    vehicleNumber: { type: String },
    entryGate: { type: String, default: "Gate 1" },
    inTime: { type: Date, default: Date.now },
    outTime: { type: Date },
    status: {
      type: String,
      enum: ["Expected", "Inside", "Exited"],
      default: "Inside",
    },
    otpCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    purpose: { type: String },
  },
  { timestamps: true }
);

export const Visitor = mongoose.model<IVisitor>("Visitor", VisitorSchema);
