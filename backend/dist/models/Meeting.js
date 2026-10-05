import mongoose, { Schema } from "mongoose";
export const MEETING_STATUSES = [
    "Upcoming",
    "Scheduled",
    "In Progress",
    "Completed",
    "Cancelled",
];
const MeetingSchema = new Schema({
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
}, { timestamps: true });
export const Meeting = mongoose.model("Meeting", MeetingSchema);
