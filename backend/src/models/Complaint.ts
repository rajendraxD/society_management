import mongoose, { Document, Schema } from "mongoose";

export const COMPLAINT_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Lift",
  "Security",
  "Cleanliness",
  "Parking",
  "Other",
] as const;

export const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved"] as const;

export const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Emergency"] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];
export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export interface IComplaint extends Document {
  title: string;
  category: ComplaintCategory;
  flatNumber: string;
  residentName: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
  /**
   * When the resident raised it. Named `raisedAt` rather than reusing
   * `createdAt`, which Mongoose owns and would overwrite on every write.
   */
  raisedAt: Date;
  resolvedAt?: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
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
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>("Complaint", ComplaintSchema);
