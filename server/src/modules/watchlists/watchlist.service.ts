import type { Types } from "mongoose";
import { AppError } from "../../utils/errors.js";
import { findInstrument } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { Watchlist, type WatchlistDoc } from "./watchlist.model.js";

function assertSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (!findInstrument(upper)) throw AppError.badRequest(`Unknown instrument: ${symbol}`);
  return upper;
}

async function getOwned(userId: Types.ObjectId, id: string): Promise<WatchlistDoc> {
  const list = await Watchlist.findOne({ _id: id, userId });
  if (!list) throw AppError.notFound("Watchlist not found");
  return list;
}

export async function listWatchlists(userId: Types.ObjectId) {
  return Watchlist.find({ userId }).sort({ createdAt: 1 });
}

export async function createWatchlist(userId: Types.ObjectId, name: string) {
  const count = await Watchlist.countDocuments({ userId });
  if (count >= 25) throw AppError.badRequest("Watchlist limit reached (25)");
  return Watchlist.create({ userId, name, items: [] });
}

export async function renameWatchlist(userId: Types.ObjectId, id: string, name: string) {
  const list = await getOwned(userId, id);
  list.name = name;
  await list.save();
  return list;
}

export async function deleteWatchlist(userId: Types.ObjectId, id: string) {
  const result = await Watchlist.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) throw AppError.notFound("Watchlist not found");
}

export async function addItem(userId: Types.ObjectId, id: string, symbol: string, note?: string) {
  const list = await getOwned(userId, id);
  const sym = assertSymbol(symbol);
  if (list.items.some((i) => i.symbol === sym)) {
    throw AppError.conflict(`${sym} is already in this watchlist`);
  }
  const maxOrder = list.items.reduce((m, i) => Math.max(m, i.order), -1);
  list.items.push({ symbol: sym, note: note ?? null, order: maxOrder + 1, addedAt: new Date() });
  await list.save();
  return list;
}

export async function removeItem(userId: Types.ObjectId, id: string, symbol: string) {
  const list = await getOwned(userId, id);
  const sym = symbol.toUpperCase();
  const before = list.items.length;
  list.items = list.items.filter((i) => i.symbol !== sym);
  if (list.items.length === before) throw AppError.notFound(`${sym} is not in this watchlist`);
  await list.save();
  return list;
}

export async function updateItemNote(userId: Types.ObjectId, id: string, symbol: string, note: string | null) {
  const list = await getOwned(userId, id);
  const item = list.items.find((i) => i.symbol === symbol.toUpperCase());
  if (!item) throw AppError.notFound("Instrument not in watchlist");
  item.note = note;
  await list.save();
  return list;
}

export async function reorderItems(userId: Types.ObjectId, id: string, symbols: string[]) {
  const list = await getOwned(userId, id);
  const currentSymbols = new Set(list.items.map((i) => i.symbol));
  if (symbols.length !== list.items.length || !symbols.every((s) => currentSymbols.has(s.toUpperCase()))) {
    throw AppError.badRequest("Reorder payload must include every instrument exactly once");
  }
  const orderMap = new Map(symbols.map((s, idx) => [s.toUpperCase(), idx]));
  for (const item of list.items) item.order = orderMap.get(item.symbol) ?? item.order;
  list.items.sort((a, b) => a.order - b.order);
  await list.save();
  return list;
}

export interface EnrichedWatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  note: string | null;
  order: number;
  quote: Awaited<ReturnType<typeof marketService.getQuote>> | null;
}

export async function withQuotes(list: WatchlistDoc): Promise<{
  id: string;
  name: string;
  items: EnrichedWatchlistItem[];
  createdAt: string;
}> {
  const symbols = list.items.map((i) => i.symbol);
  const quotes = await marketService.getQuotes(symbols);
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const items: EnrichedWatchlistItem[] = list.items
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const inst = findInstrument(item.symbol);
      return {
        symbol: item.symbol,
        name: inst?.name ?? item.symbol,
        exchange: inst?.exchange ?? "NSE",
        sector: inst?.sector ?? null,
        note: item.note ?? null,
        order: item.order,
        quote: bySymbol.get(item.symbol) ?? null,
      };
    });
  return { id: list.id, name: list.name, items, createdAt: list.createdAt.toISOString() };
}
