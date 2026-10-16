import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface WatchlistItem {
  symbol: string;
  note?: string | null;
  order: number;
  addedAt: Date;
}

export interface WatchlistDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  name: string;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<WatchlistItem>(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    note: { type: String, default: null, maxlength: 1000 },
    order: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const watchlistSchema = new Schema<WatchlistDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
);

watchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Watchlist: Model<WatchlistDoc> = model<WatchlistDoc>("Watchlist", watchlistSchema);
