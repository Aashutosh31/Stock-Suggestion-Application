import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type AlertType =
  | "price_above"
  | "price_below"
  | "pct_change_above"
  | "pct_change_below"
  | "volume_above"
  | "rsi_above"
  | "rsi_below";

export const ALERT_TYPES: AlertType[] = [
  "price_above",
  "price_below",
  "pct_change_above",
  "pct_change_below",
  "volume_above",
  "rsi_above",
  "rsi_below",
];

export interface AlertTrigger {
  at: Date;
  observedValue: number | null;
  message: string;
}

export interface AlertDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  symbol: string;
  type: AlertType;
  threshold: number;
  status: "active" | "paused" | "triggered";
  note?: string | null;
  lastCheckedAt?: Date | null;
  triggeredAt?: Date | null;
  triggerCount: number;
  triggerHistory: AlertTrigger[];
  createdAt: Date;
  updatedAt: Date;
}

const triggerSchema = new Schema<AlertTrigger>(
  {
    at: { type: Date, required: true },
    observedValue: { type: Number, default: null },
    message: { type: String, required: true },
  },
  { _id: false },
);

const alertSchema = new Schema<AlertDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ALERT_TYPES, required: true },
    threshold: { type: Number, required: true },
    status: { type: String, enum: ["active", "paused", "triggered"], default: "active" },
    note: { type: String, default: null, maxlength: 500 },
    lastCheckedAt: { type: Date, default: null },
    triggeredAt: { type: Date, default: null },
    triggerCount: { type: Number, default: 0 },
    triggerHistory: { type: [triggerSchema], default: [] },
  },
  { timestamps: true },
);

alertSchema.index({ userId: 1, symbol: 1, type: 1, threshold: 1 });
alertSchema.index({ status: 1 });

export const Alert: Model<AlertDoc> = model<AlertDoc>("Alert", alertSchema);

export interface NotificationDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  symbol?: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    symbol: { type: String, default: null, uppercase: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<NotificationDoc> = model<NotificationDoc>("Notification", notificationSchema);
