import mongoose, { Document, Schema } from "mongoose";

export const MEETING_STATUSES = [
  "Upcoming",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

export interface IMeeting extends Document {
  title: string;
  /** Short descriptor shown under the title, e.g. "Annual General Meeting". */
  subtitle?: string;
  meetingType: "AGM" | "EGM" | "Managing Committee" | "Emergency";
  scheduledDate: Date;
  venue: string;
  agendaItems: string[];
  quorumRequired: number;
  confirmedAttendees: number;
  minutesOfMeeting?: string;
  status: (typeof MEETING_STATUSES)[number];
  /** Count of meetings already held, shown alongside the upcoming list. */
  pastMeetingsCount?: number;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    meetingType: {
      type: String,
      enum: ["AGM", "EGM", "Managing Committee", "Emergency"],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    venue: { type: String, default: "Clubhouse Conference Room & Online" },
    agendaItems: [{ type: String }],
    quorumRequired: { type: Number, default: 25 },
    confirmedAttendees: { type: Number, default: 32 },
    minutesOfMeeting: { type: String },
    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "Scheduled",
    },
    pastMeetingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Meeting = mongoose.model<IMeeting>("Meeting", MeetingSchema);
