import mongoose, { Document, Schema } from "mongoose";

export interface IComplaint extends Document {
  title: string;
  category: "Plumbing" | "Electrical" | "Lift" | "Security" | "Cleanliness" | "Parking" | "Other";
  flatNumber: string;
  residentName: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved";
  priority: "Low" | "Medium" | "High" | "Emergency";
  assignedTo?: string;
  resolvedAt?: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Plumbing", "Electrical", "Lift", "Security", "Cleanliness", "Parking", "Other"],
      default: "Other",
    },
    flatNumber: { type: String, required: true },
    residentName: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Emergency"], default: "Medium" },
    assignedTo: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>("Complaint", ComplaintSchema);
