import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
}

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  timezone: string;
  numberFormat: "en-IN" | "en-US";
  dashboardSections: string[];
  notifications: NotificationPreferences;
}

export interface UserDoc extends Document<Types.ObjectId> {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin";
  emailVerified: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  preferences: UserPreferences;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_DASHBOARD_SECTIONS = [
  "indices",
  "movers",
  "sectors",
  "watchlist",
  "portfolio",
  "news",
  "suggestions",
];

const preferencesSchema = new Schema<UserPreferences>(
  {
    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
    timezone: { type: String, default: "Asia/Kolkata" },
    numberFormat: { type: String, enum: ["en-IN", "en-US"], default: "en-IN" },
    dashboardSections: { type: [String], default: () => [...DEFAULT_DASHBOARD_SECTIONS] },
    notifications: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    preferences: { type: preferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret._id;
        return ret;
      },
    },
  },
);

export const User: Model<UserDoc> = model<UserDoc>("User", userSchema);
export { DEFAULT_DASHBOARD_SECTIONS };
