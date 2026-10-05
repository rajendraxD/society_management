import mongoose, { Schema } from "mongoose";
const BillSchema = new Schema({
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
}, { timestamps: true });
export const Bill = mongoose.model("Bill", BillSchema);
