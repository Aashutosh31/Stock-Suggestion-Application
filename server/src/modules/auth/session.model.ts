import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface SessionDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string | null;
  ip?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// TTL index: sessions are removed automatically once expired.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<SessionDoc> = model<SessionDoc>("Session", sessionSchema);
