import mongoose, { Schema } from "mongoose";
export const COMPLAINT_CATEGORIES = [
    "Plumbing",
    "Electrical",
    "Lift",
    "Security",
    "Cleanliness",
    "Parking",
    "Other",
];
export const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved"];
export const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Emergency"];
const ComplaintSchema = new Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        enum: COMPLAINT_CATEGORIES,
        default: "Other",
    },
    flatNumber: { type: String, required: true, index: true },
    residentName: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: COMPLAINT_STATUSES, default: "Open", index: true },
    priority: { type: String, enum: COMPLAINT_PRIORITIES, default: "Medium" },
    assignedTo: { type: String },
    raisedAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
}, { timestamps: true });
export const Complaint = mongoose.model("Complaint", ComplaintSchema);
