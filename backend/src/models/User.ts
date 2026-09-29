import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "admin" | "resident" | "security" | "committee";

export const USER_ROLES = ["admin", "resident", "security", "committee"] as const;

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** bcrypt hash — never returned by a query unless explicitly selected. */
  passwordHash: string;
  /**
   * Bumped on logout/password change so previously issued refresh tokens stop
   * verifying. Cheap revocation without a token blacklist collection.
   */
  refreshTokenVersion: number;
  flatNumber?: string;
  wing?: string;
  tower?: string;
  floor?: string;
  ownership?: string;
  shift?: string;
  designation?: string;
  title?: string;
  badgeLine?: string;
  avatar?: string;
  aadhaarLastFour?: string;
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
