import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface PortfolioDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  name: string;
  baseCurrency: string;
  isDefault: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<PortfolioDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    baseCurrency: { type: String, default: "INR" },
    isDefault: { type: Boolean, default: false },
    notes: { type: String, default: null, maxlength: 2000 },
  },
  { timestamps: true },
);

portfolioSchema.index({ userId: 1, name: 1 }, { unique: true });

export type TransactionSide = "buy" | "sell";

export interface TransactionDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  symbol: string;
  side: TransactionSide;
  quantity: number;
  price: number;
  fees: number;
  tradedAt: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioId: { type: Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true, min: [0.0001, "quantity must be positive"] },
    price: { type: Number, required: true, min: [0, "price cannot be negative"] },
    fees: { type: Number, default: 0, min: [0, "fees cannot be negative"] },
    tradedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true },
);

transactionSchema.index({ portfolioId: 1, tradedAt: -1 });
transactionSchema.index({ userId: 1, symbol: 1 });

export const Portfolio: Model<PortfolioDoc> = model<PortfolioDoc>("Portfolio", portfolioSchema);
export const Transaction: Model<TransactionDoc> = model<TransactionDoc>("Transaction", transactionSchema);
