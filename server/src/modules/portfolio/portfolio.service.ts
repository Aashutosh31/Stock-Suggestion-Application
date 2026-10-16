import type { Types } from "mongoose";
import { AppError } from "../../utils/errors.js";
import { findInstrument } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { Portfolio, Transaction, type TransactionDoc } from "./portfolio.model.js";

export interface Holding {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  quantity: number;
  averageCost: number;
  investedValue: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  firstBoughtAt: string | null;
  priceAvailable: boolean;
}

export interface PortfolioComputation {
  holdings: Holding[];
  totals: {
    investedValue: number;
    currentValue: number | null;
    unrealizedPnl: number | null;
    unrealizedPnlPercent: number | null;
    realizedPnl: number;
    totalFees: number;
    holdingsCount: number;
    incomplete: boolean;
  };
}

interface PositionState {
  qty: number;
  costTotal: number;
  realized: number;
  firstBoughtAt: Date | null;
}

/** Computes holdings using moving-average cost. Fees are added to cost basis on buys. */
export function computeHoldings(
  transactions: TransactionDoc[],
  priceMap: Map<string, number>,
): PortfolioComputation {
  const positions = new Map<string, PositionState>();
  let totalFees = 0;
  let realizedPnl = 0;

  const sorted = [...transactions].sort((a, b) => a.tradedAt.getTime() - b.tradedAt.getTime());
  for (const tx of sorted) {
    totalFees += tx.fees;
    const state = positions.get(tx.symbol) ?? { qty: 0, costTotal: 0, realized: 0, firstBoughtAt: null };
    if (tx.side === "buy") {
      state.costTotal += tx.quantity * tx.price + tx.fees;
      state.qty += tx.quantity;
      if (!state.firstBoughtAt) state.firstBoughtAt = tx.tradedAt;
    } else {
      const avgCost = state.qty > 0 ? state.costTotal / state.qty : 0;
      const realized = (tx.price - avgCost) * tx.quantity - tx.fees;
      state.realized += realized;
      realizedPnl += realized;
      state.qty -= tx.quantity;
      state.costTotal -= avgCost * tx.quantity;
      if (state.qty <= 1e-9) {
        state.qty = 0;
        state.costTotal = 0;
      }
    }
    positions.set(tx.symbol, state);
  }

  const holdings: Holding[] = [];
  let investedValue = 0;
  let currentValue = 0;
  let incomplete = false;

  for (const [symbol, state] of positions) {
    if (state.qty <= 0) continue;
    const inst = findInstrument(symbol);
    const averageCost = state.costTotal / state.qty;
    const invested = state.costTotal;
    const price = priceMap.get(symbol);
    const hasPrice = typeof price === "number" && Number.isFinite(price);
    if (!hasPrice) incomplete = true;
    const value = hasPrice ? price * state.qty : null;
    const unrealized = hasPrice ? (price - averageCost) * state.qty : null;
    investedValue += invested;
    if (value !== null) currentValue += value;
    holdings.push({
      symbol,
      name: inst?.name ?? symbol,
      exchange: inst?.exchange ?? "NSE",
      sector: inst?.sector ?? null,
      quantity: round(state.qty, 4),
      averageCost: round(averageCost, 4),
      investedValue: round(invested, 2),
      currentPrice: hasPrice ? round(price, 2) : null,
      currentValue: value === null ? null : round(value, 2),
      unrealizedPnl: unrealized === null ? null : round(unrealized, 2),
      unrealizedPnlPercent:
        unrealized === null || invested === 0 ? null : round((unrealized / invested) * 100, 2),
      realizedPnl: round(state.realized, 2),
      firstBoughtAt: state.firstBoughtAt ? state.firstBoughtAt.toISOString() : null,
      priceAvailable: hasPrice,
    });
  }

  holdings.sort((a, b) => (b.currentValue ?? b.investedValue) - (a.currentValue ?? a.investedValue));
  const unrealizedPnl = incomplete ? null : round(currentValue - investedValue, 2);

  return {
    holdings,
    totals: {
      investedValue: round(investedValue, 2),
      currentValue: incomplete ? null : round(currentValue, 2),
      unrealizedPnl,
      unrealizedPnlPercent:
        unrealizedPnl === null || investedValue === 0 ? null : round((unrealizedPnl / investedValue) * 100, 2),
      realizedPnl: round(realizedPnl, 2),
      totalFees: round(totalFees, 2),
      holdingsCount: holdings.length,
      incomplete,
    },
  };
}

function round(v: number, d = 2): number {
  const f = 10 ** d;
  return Math.round((v + Number.EPSILON) * f) / f;
}

async function ownedPortfolio(userId: Types.ObjectId, id: string) {
  const portfolio = await Portfolio.findOne({ _id: id, userId });
  if (!portfolio) throw AppError.notFound("Portfolio not found");
  return portfolio;
}

export async function listPortfolios(userId: Types.ObjectId) {
  return Portfolio.find({ userId }).sort({ createdAt: 1 });
}

export async function getDefaultPortfolio(userId: Types.ObjectId) {
  let portfolio = await Portfolio.findOne({ userId, isDefault: true });
  if (!portfolio) {
    portfolio = await Portfolio.findOne({ userId }).sort({ createdAt: 1 });
  }
  if (!portfolio) portfolio = await Portfolio.create({ userId, name: "My Portfolio", isDefault: true });
  return portfolio;
}

export async function createPortfolio(userId: Types.ObjectId, name: string) {
  const count = await Portfolio.countDocuments({ userId });
  if (count >= 10) throw AppError.badRequest("Portfolio limit reached (10)");
  return Portfolio.create({ userId, name, isDefault: count === 0 });
}

export async function deletePortfolio(userId: Types.ObjectId, id: string) {
  const portfolio = await ownedPortfolio(userId, id);
  if (portfolio.isDefault) throw AppError.badRequest("The default portfolio cannot be deleted");
  await Promise.all([
    Transaction.deleteMany({ portfolioId: portfolio._id, userId }),
    Portfolio.deleteOne({ _id: portfolio._id, userId }),
  ]);
}

export async function listTransactions(userId: Types.ObjectId, portfolioId: string) {
  await ownedPortfolio(userId, portfolioId);
  return Transaction.find({ portfolioId, userId }).sort({ tradedAt: -1 });
}

export async function addTransaction(
  userId: Types.ObjectId,
  portfolioId: string,
  input: { symbol: string; side: "buy" | "sell"; quantity: number; price: number; fees: number; tradedAt: Date; notes?: string | null },
) {
  await ownedPortfolio(userId, portfolioId);
  const symbol = input.symbol.toUpperCase();
  if (!findInstrument(symbol)) throw AppError.badRequest(`Unknown instrument: ${input.symbol}`);

  if (input.side === "sell") {
    const existing = await Transaction.find({ portfolioId, userId, symbol });
    const priceMap = new Map<string, number>();
    const held = computeHoldings(existing, priceMap).holdings.find((h) => h.symbol === symbol);
    const available = held?.quantity ?? 0;
    if (input.quantity > available + 1e-9) {
      throw AppError.badRequest(`Cannot sell ${input.quantity}; only ${available} held`);
    }
  }

  return Transaction.create({ ...input, symbol, userId, portfolioId });
}

export async function updateTransaction(
  userId: Types.ObjectId,
  transactionId: string,
  patch: Partial<{ quantity: number; price: number; fees: number; tradedAt: Date; notes: string | null }>,
) {
  const tx = await Transaction.findOne({ _id: transactionId, userId });
  if (!tx) throw AppError.notFound("Transaction not found");
  Object.assign(tx, patch);
  await tx.save();
  return tx;
}

export async function deleteTransaction(userId: Types.ObjectId, transactionId: string) {
  const result = await Transaction.deleteOne({ _id: transactionId, userId });
  if (result.deletedCount === 0) throw AppError.notFound("Transaction not found");
}

export async function getComputation(userId: Types.ObjectId, portfolioId: string): Promise<PortfolioComputation> {
  await ownedPortfolio(userId, portfolioId);
  const transactions = await Transaction.find({ portfolioId, userId });
  const symbols = [...new Set(transactions.map((t) => t.symbol))];
  const quotes = await marketService.getQuotes(symbols);
  const priceMap = new Map<string, number>();
  for (const q of quotes) {
    if (typeof q.price === "number" && Number.isFinite(q.price)) priceMap.set(q.symbol, q.price);
  }
  return computeHoldings(transactions, priceMap);
}
