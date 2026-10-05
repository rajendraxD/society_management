import mongoose, { Schema } from "mongoose";
export const USER_ROLES = ["admin", "resident", "security", "committee"];
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: { type: String, required: true },
    role: {
        type: String,
        enum: USER_ROLES,
        default: "resident",
    },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
    flatNumber: { type: String },
    wing: { type: String },
    tower: { type: String },
    floor: { type: String },
    ownership: { type: String },
    shift: { type: String },
    designation: { type: String },
    title: { type: String },
    badgeLine: { type: String },
    avatar: { type: String },
    aadhaarLastFour: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const User = mongoose.model("User", UserSchema);
