import mongoose, { Document, Schema } from "mongoose";

export interface IBill extends Document {
  flatNumber: string;
  wing: string;
  residentName: string;
  billingMonth: string;
  amount: number;
  maintenanceCharges: number;
  sinkingFundCharges: number;
  waterCharges: number;
  parkingCharges: number;
  clubCharges: number;
  dueDate: Date;
  status: "paid" | "pending" | "overdue";
  paidDate?: Date;
  paymentMode?: string;
  transactionRef?: string;
}

const BillSchema = new Schema<IBill>(
  {
    flatNumber: { type: String, required: true },
    wing: { type: String, required: true },
    residentName: { type: String, required: true },
    billingMonth: { type: String, required: true },
    amount: { type: Number, required: true },
    maintenanceCharges: { type: Number, required: true },
    sinkingFundCharges: { type: Number, default: 500 },
    waterCharges: { type: Number, default: 450 },
    parkingCharges: { type: Number, default: 600 },
    clubCharges: { type: Number, default: 300 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },
    paidDate: { type: Date },
    paymentMode: { type: String },
    transactionRef: { type: String },
  },
  { timestamps: true }
);

export const Bill = mongoose.model<IBill>("Bill", BillSchema);
