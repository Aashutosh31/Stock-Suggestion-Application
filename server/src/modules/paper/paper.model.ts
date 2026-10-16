import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface PaperConfig {
  /** Percentage commission applied to traded value (e.g. 0.05 = 0.05%). */
  commissionPercent: number;
  /** Fixed fee per order in base currency. */
  flatFee: number;
  /** Simulated slippage applied to the fill price, in percent. */
  slippagePercent: number;
}

export interface PaperAccountDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  startingCash: number;
  cash: number;
  config: PaperConfig;
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const configSchema = new Schema<PaperConfig>(
  {
    commissionPercent: { type: Number, default: 0.05, min: 0, max: 5 },
    flatFee: { type: Number, default: 0, min: 0, max: 1000 },
    slippagePercent: { type: Number, default: 0.05, min: 0, max: 5 },
  },
  { _id: false },
);

const paperAccountSchema = new Schema<PaperAccountDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    startingCash: { type: Number, default: 1_000_000, min: 0 },
    cash: { type: Number, required: true, min: 0 },
    config: { type: configSchema, default: () => ({}) },
    lastResetAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type PaperSide = "buy" | "sell";

export interface PaperTradeDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  symbol: string;
  side: PaperSide;
  quantity: number;
  fillPrice: number;
  grossValue: number;
  fees: number;
  realizedPnl: number | null;
  tradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paperTradeSchema = new Schema<PaperTradeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    fillPrice: { type: Number, required: true, min: 0 },
    grossValue: { type: Number, required: true, min: 0 },
    fees: { type: Number, required: true, min: 0 },
    realizedPnl: { type: Number, default: null },
    tradedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

paperTradeSchema.index({ userId: 1, tradedAt: -1 });

export const PaperAccount: Model<PaperAccountDoc> = model<PaperAccountDoc>("PaperAccount", paperAccountSchema);
export const PaperTrade: Model<PaperTradeDoc> = model<PaperTradeDoc>("PaperTrade", paperTradeSchema);
