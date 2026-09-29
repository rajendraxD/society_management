import mongoose, { Document, Schema } from "mongoose";

export interface INotice extends Document {
  title: string;
  category: "General" | "Maintenance" | "Emergency" | "Billing" | "Event";
  content: string;
  publishedDate: Date;
  expiresDate?: Date;
  isPinned: boolean;
  priority: "Normal" | "Urgent";
  author: string;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["General", "Maintenance", "Emergency", "Billing", "Event"],
      default: "General",
    },
    content: { type: String, required: true },
    publishedDate: { type: Date, default: Date.now },
    expiresDate: { type: Date },
    isPinned: { type: Boolean, default: false },
    priority: { type: String, enum: ["Normal", "Urgent"], default: "Normal" },
    author: { type: String, default: "Managing Committee" },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>("Notice", NoticeSchema);
