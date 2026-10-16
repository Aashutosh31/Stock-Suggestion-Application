import type { Types } from "mongoose";
import { AppError } from "../../utils/errors.js";
import { withLock } from "../../utils/lock.js";
import { findInstrument } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { PaperAccount, PaperTrade, type PaperConfig, type PaperTradeDoc } from "./paper.model.js";

export interface PaperPosition {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  investedValue: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
}

const DEFAULT_STARTING_CASH = 1_000_000;

export async function getAccount(userId: Types.ObjectId) {
  let account = await PaperAccount.findOne({ userId });
  if (!account) {
    account = await PaperAccount.create({ userId, startingCash: DEFAULT_STARTING_CASH, cash: DEFAULT_STARTING_CASH });
  }
  return account;
}

export async function updateConfig(userId: Types.ObjectId, patch: Partial<PaperConfig>) {
  const account = await getAccount(userId);
  account.config = { ...(account.config as unknown as PaperConfig), ...patch };
  account.markModified("config");
  await account.save();
  return account;
}

export async function resetAccount(userId: Types.ObjectId, startingCash: number) {
  return withLock(`paper:${userId.toString()}`, async () => {
    await PaperTrade.deleteMany({ userId });
    const account = await getAccount(userId);
    account.startingCash = startingCash;
    account.cash = startingCash;
    account.lastResetAt = new Date();
    await account.save();
    return account;
  });
}

export function computePositions(trades: PaperTradeDoc[], priceMap: Map<string, number>) {
  interface State {
    qty: number;
    costTotal: number;
    realized: number;
  }
  const states = new Map<string, State>();
  const sorted = [...trades].sort((a, b) => a.tradedAt.getTime() - b.tradedAt.getTime());
  let realized = 0;
  for (const t of sorted) {
    const s = states.get(t.symbol) ?? { qty: 0, costTotal: 0, realized: 0 };
    if (t.side === "buy") {
      s.costTotal += t.grossValue + t.fees;
      s.qty += t.quantity;
    } else {
      const avg = s.qty > 0 ? s.costTotal / s.qty : 0;
      const pnl = (t.fillPrice - avg) * t.quantity - t.fees;
      s.realized += pnl;
      realized += pnl;
      s.qty -= t.quantity;
      s.costTotal -= avg * t.quantity;
      if (s.qty <= 1e-9) {
        s.qty = 0;
        s.costTotal = 0;
      }
    }
    states.set(t.symbol, s);
  }

  const positions: PaperPosition[] = [];
  let invested = 0;
  let marketValue = 0;
  let incomplete = false;
  for (const [symbol, s] of states) {
    if (s.qty <= 0) continue;
    const avg = s.costTotal / s.qty;
    const price = priceMap.get(symbol);
    const hasPrice = typeof price === "number" && Number.isFinite(price);
    if (!hasPrice) incomplete = true;
    const value = hasPrice ? price * s.qty : null;
    if (value !== null) marketValue += value;
    invested += s.costTotal;
    positions.push({
      symbol,
      name: findInstrument(symbol)?.name ?? symbol,
      quantity: round(s.qty, 4),
      averageCost: round(avg, 4),
      investedValue: round(s.costTotal, 2),
      currentPrice: hasPrice ? round(price, 2) : null,
      currentValue: value === null ? null : round(value, 2),
      unrealizedPnl: hasPrice ? round((price - avg) * s.qty, 2) : null,
      unrealizedPnlPercent: hasPrice && avg > 0 ? round(((price - avg) / avg) * 100, 2) : null,
      realizedPnl: round(s.realized, 2),
    });
  }
  positions.sort((a, b) => (b.currentValue ?? b.investedValue) - (a.currentValue ?? a.investedValue));
  return { positions, realized: round(realized, 2), invested: round(invested, 2), marketValue: incomplete ? null : round(marketValue, 2), incomplete };
}

function round(v: number, d = 2) {
  const f = 10 ** d;
  return Math.round((v + Number.EPSILON) * f) / f;
}

export interface OrderInput {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
}

export async function placeOrder(userId: Types.ObjectId, input: OrderInput) {
  const symbol = input.symbol.toUpperCase();
  const inst = findInstrument(symbol);
  if (!inst) throw AppError.badRequest(`Unknown instrument: ${input.symbol}`);
  if (!(input.quantity > 0)) throw AppError.badRequest("Quantity must be positive");

  return withLock(`paper:${userId.toString()}`, async () => {
    const account = await getAccount(userId);
    const quote = await marketService.getQuote(symbol);
    if (quote.price === null || !Number.isFinite(quote.price)) {
      throw AppError.unavailable(`No live price available for ${symbol}; order rejected`);
    }
    const config = account.config;
    const slip = (config.slippagePercent / 100) * (input.side === "buy" ? 1 : -1);
    const fillPrice = round(quote.price * (1 + slip), 2);
    const grossValue = round(fillPrice * input.quantity, 2);
    const fees = round((grossValue * config.commissionPercent) / 100 + config.flatFee, 2);

    if (input.side === "buy") {
      const required = grossValue + fees;
      const updated = await PaperAccount.findOneAndUpdate(
        { userId, cash: { $gte: required } },
        { $inc: { cash: -required } },
        { returnDocument: "after" },
      );
      if (!updated) throw AppError.badRequest("Insufficient virtual cash for this order");
      const trade = await PaperTrade.create({
        userId,
        symbol,
        side: "buy",
        quantity: input.quantity,
        fillPrice,
        grossValue,
        fees,
        realizedPnl: null,
        tradedAt: new Date(),
      });
      return { trade, cash: updated.cash };
    }

    // Sell: validate holdings computed from existing trades.
    const existing = await PaperTrade.find({ userId, symbol });
    const positions = computePositions(existing, new Map()).positions;
    const held = positions.find((p) => p.symbol === symbol)?.quantity ?? 0;
    if (input.quantity > held + 1e-9) {
      throw AppError.badRequest(`Cannot sell ${input.quantity}; only ${held} held`);
    }
    const proceeds = round(grossValue - fees, 2);
    const state = (() => {
      const s = { qty: 0, costTotal: 0 };
      for (const t of [...existing].sort((a, b) => a.tradedAt.getTime() - b.tradedAt.getTime())) {
        if (t.side === "buy") {
          s.costTotal += t.grossValue + t.fees;
          s.qty += t.quantity;
        } else {
          const avg = s.qty > 0 ? s.costTotal / s.qty : 0;
          s.qty -= t.quantity;
          s.costTotal -= avg * t.quantity;
          if (s.qty <= 1e-9) {
            s.qty = 0;
            s.costTotal = 0;
          }
        }
      }
      return s;
    })();
    const avgCost = state.qty > 0 ? state.costTotal / state.qty : 0;
    const realizedPnl = round((fillPrice - avgCost) * input.quantity - fees, 2);

    const updated = await PaperAccount.findOneAndUpdate({ userId }, { $inc: { cash: proceeds } }, { returnDocument: "after" });
    const trade = await PaperTrade.create({
      userId,
      symbol,
      side: "sell",
      quantity: input.quantity,
      fillPrice,
      grossValue,
      fees,
      realizedPnl,
      tradedAt: new Date(),
    });
    return { trade, cash: updated?.cash ?? account.cash };
  });
}

export async function portfolioSummary(userId: Types.ObjectId) {
  const account = await getAccount(userId);
  const trades = await PaperTrade.find({ userId });
  const symbols = [...new Set(trades.map((t) => t.symbol))];
  const quotes = await marketService.getQuotes(symbols);
  const priceMap = new Map<string, number>();
  for (const q of quotes) if (typeof q.price === "number") priceMap.set(q.symbol, q.price);
  const computed = computePositions(trades, priceMap);
  const equity = account.cash + (computed.marketValue ?? 0);
  return {
    account: {
      startingCash: account.startingCash,
      cash: account.cash,
      config: account.config,
      lastResetAt: account.lastResetAt.toISOString(),
      createdAt: account.createdAt.toISOString(),
    },
    positions: computed.positions,
    totals: {
      investedValue: computed.invested,
      marketValue: computed.marketValue,
      cash: account.cash,
      equity: round(equity, 2),
      unrealizedPnl: computed.incomplete
        ? null
        : round(computed.positions.reduce((a, p) => a + (p.unrealizedPnl ?? 0), 0), 2),
      realizedPnl: computed.realized,
      totalReturn: round(equity - account.startingCash, 2),
      totalReturnPercent: account.startingCash
        ? round(((equity - account.startingCash) / account.startingCash) * 100, 2)
        : 0,
    },
  };
}
