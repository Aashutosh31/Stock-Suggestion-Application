import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface SavedScreenDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const savedScreenSchema = new Schema<SavedScreenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    filters: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

savedScreenSchema.index({ userId: 1, name: 1 }, { unique: true });

export const SavedScreen: Model<SavedScreenDoc> = model<SavedScreenDoc>("SavedScreen", savedScreenSchema);

export interface ResearchNoteDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  symbol: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const researchNoteSchema = new Schema<ResearchNoteDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 8000 },
  },
  { timestamps: true },
);

researchNoteSchema.index({ userId: 1, symbol: 1, createdAt: -1 });

export const ResearchNote: Model<ResearchNoteDoc> = model<ResearchNoteDoc>("ResearchNote", researchNoteSchema);

export interface RecentlyViewedItem {
  symbol: string;
  viewedAt: Date;
}

export interface RecentlyViewedDoc extends Document<Types.ObjectId> {
  id: string;
  userId: Types.ObjectId;
  items: RecentlyViewedItem[];
  createdAt: Date;
  updatedAt: Date;
}

const recentlyViewedSchema = new Schema<RecentlyViewedDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: {
      type: [
        new Schema<RecentlyViewedItem>(
          {
            symbol: { type: String, required: true, uppercase: true },
            viewedAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const RecentlyViewed: Model<RecentlyViewedDoc> = model<RecentlyViewedDoc>(
  "RecentlyViewed",
  recentlyViewedSchema,
);
