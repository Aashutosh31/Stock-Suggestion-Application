import { describe, expect, it } from "vitest";
import { computeHoldings } from "../modules/portfolio/portfolio.service.js";
import { computePositions } from "../modules/paper/paper.service.js";
import type { TransactionDoc } from "../modules/portfolio/portfolio.model.js";
import type { PaperTradeDoc } from "../modules/paper/paper.model.js";

function tx(partial: Partial<TransactionDoc> & { symbol: string; side: "buy" | "sell"; quantity: number; price: number }, daysAgo = 0): TransactionDoc {
  return {
    fees: 0,
    tradedAt: new Date(Date.now() - daysAgo * 86_400_000),
    ...partial,
  } as TransactionDoc;
}

describe("computeHoldings (portfolio)", () => {
  it("computes average cost across multiple buys", () => {
    const txs = [
      tx({ symbol: "RELIANCE", side: "buy", quantity: 10, price: 100 }, 10),
      tx({ symbol: "RELIANCE", side: "buy", quantity: 10, price: 120 }, 5),
    ];
    const result = computeHoldings(txs, new Map([["RELIANCE", 150]]));
    const h = result.holdings.find((x) => x.symbol === "RELIANCE")!;
    expect(h.quantity).toBe(20);
    expect(h.averageCost).toBeCloseTo(110);
    expect(h.investedValue).toBeCloseTo(2200);
    expect(h.currentValue).toBeCloseTo(3000);
    expect(h.unrealizedPnl).toBeCloseTo(800);
  });

  it("realises P&L correctly on a partial sell", () => {
    const txs = [
      tx({ symbol: "ITC", side: "buy", quantity: 100, price: 400 }, 20),
      tx({ symbol: "ITC", side: "sell", quantity: 40, price: 500 }, 5),
    ];
    const result = computeHoldings(txs, new Map([["ITC", 450]]));
    const h = result.holdings.find((x) => x.symbol === "ITC")!;
    expect(h.realizedPnl).toBeCloseTo((500 - 400) * 40);
    expect(h.quantity).toBe(60);
    expect(h.averageCost).toBeCloseTo(400); // avg cost unchanged by a sell
    expect(result.totals.realizedPnl).toBeCloseTo(4000);
  });

  it("includes fees in the buy cost basis", () => {
    const txs = [tx({ symbol: "TCS", side: "buy", quantity: 10, price: 1000, fees: 50 } as never, 1)];
    const result = computeHoldings(txs, new Map([["TCS", 1000]]));
    expect(result.holdings[0]?.averageCost).toBeCloseTo(1005);
  });

  it("marks totals incomplete when a price is missing and never treats it as zero", () => {
    const txs = [tx({ symbol: "INFY", side: "buy", quantity: 10, price: 100 }, 1)];
    const result = computeHoldings(txs, new Map());
    expect(result.totals.incomplete).toBe(true);
    expect(result.totals.currentValue).toBeNull();
    expect(result.totals.unrealizedPnl).toBeNull();
    expect(result.holdings[0]?.priceAvailable).toBe(false);
  });

  it("drops fully-closed positions from holdings", () => {
    const txs = [
      tx({ symbol: "SBIN", side: "buy", quantity: 10, price: 100 }, 10),
      tx({ symbol: "SBIN", side: "sell", quantity: 10, price: 120 }, 5),
    ];
    const result = computeHoldings(txs, new Map([["SBIN", 130]]));
    expect(result.holdings).toHaveLength(0);
    expect(result.totals.realizedPnl).toBeCloseTo(200);
  });
});

function trade(partial: Partial<PaperTradeDoc> & { symbol: string; side: "buy" | "sell"; quantity: number; fillPrice: number }, daysAgo = 0): PaperTradeDoc {
  const grossValue = partial.quantity * partial.fillPrice;
  return {
    fees: 0,
    grossValue,
    tradedAt: new Date(Date.now() - daysAgo * 86_400_000),
    ...partial,
  } as PaperTradeDoc;
}

describe("computePositions (paper trading)", () => {
  it("computes average entry and unrealized P&L", () => {
    const trades = [
      trade({ symbol: "TATAMOTORS", side: "buy", quantity: 10, fillPrice: 1000 }, 5),
      trade({ symbol: "TATAMOTORS", side: "buy", quantity: 10, fillPrice: 1100 }, 3),
    ];
    const result = computePositions(trades, new Map([["TATAMOTORS", 1200]]));
    const p = result.positions[0]!;
    expect(p.quantity).toBe(20);
    expect(p.averageCost).toBeCloseTo(1050);
    expect(p.unrealizedPnl).toBeCloseTo(3000);
  });

  it("realises P&L on sells and leaves average cost intact", () => {
    const trades = [
      trade({ symbol: "SBIN", side: "buy", quantity: 100, fillPrice: 800 }, 10),
      trade({ symbol: "SBIN", side: "sell", quantity: 50, fillPrice: 900 }, 2),
    ];
    const result = computePositions(trades, new Map([["SBIN", 850]]));
    expect(result.realized).toBeCloseTo(5000);
    expect(result.positions[0]?.quantity).toBe(50);
    expect(result.positions[0]?.averageCost).toBeCloseTo(800);
  });

  it("flags incomplete market value when a price is unavailable", () => {
    const trades = [trade({ symbol: "XYZ", side: "buy", quantity: 10, fillPrice: 100 }, 1)];
    const result = computePositions(trades, new Map());
    expect(result.incomplete).toBe(true);
    expect(result.marketValue).toBeNull();
    expect(result.positions[0]?.currentValue).toBeNull();
  });
});
