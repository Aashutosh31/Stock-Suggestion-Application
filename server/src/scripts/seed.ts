/**
 * Seeds clearly-labelled DEMO data so the product can be explored immediately.
 *
 *   npm run seed
 *
 * Creates/updates the shared demo account (demo@nivesh.local) with watchlists,
 * a sample portfolio, paper trades, alerts and research notes. Safe to re-run.
 * It never touches real user accounts.
 */
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { logger } from "../config/logger.js";
import { hashPassword } from "../modules/auth/password.js";
import { User } from "../modules/users/user.model.js";
import { Watchlist } from "../modules/watchlists/watchlist.model.js";
import { Portfolio, Transaction } from "../modules/portfolio/portfolio.model.js";
import { PaperAccount, PaperTrade } from "../modules/paper/paper.model.js";
import { Alert } from "../modules/alerts/alert.model.js";
import { ResearchNote } from "../modules/research/research.model.js";
import { Notification } from "../modules/alerts/alert.model.js";

const DEMO_EMAIL = "demo@nivesh.local";
const DEMO_PASSWORD = "demo-access-nivesh-terminal";

const WATCHLIST_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "TATAMOTORS", "SBIN", "LT"];

const SAMPLE_HOLDINGS: { symbol: string; quantity: number; price: number; daysAgo: number }[] = [
  { symbol: "RELIANCE", quantity: 20, price: 2820, daysAgo: 320 },
  { symbol: "TCS", quantity: 12, price: 3900, daysAgo: 260 },
  { symbol: "HDFCBANK", quantity: 30, price: 1580, daysAgo: 200 },
  { symbol: "INFY", quantity: 25, price: 1520, daysAgo: 150 },
  { symbol: "ITC", quantity: 80, price: 430, daysAgo: 90 },
];

async function seed(): Promise<void> {
  await connectDatabase();
  logger.info("seeding demo data (this does not touch real users)");

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      email: DEMO_EMAIL,
      name: "Demo Explorer",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      emailVerified: true,
    });
  }
  const userId = user._id;

  const watchlist = await Watchlist.findOneAndUpdate(
    { userId, name: "My Watchlist" },
    {
      $setOnInsert: {
        userId,
        name: "My Watchlist",
        items: WATCHLIST_SYMBOLS.map((symbol, order) => ({ symbol, note: null, order, addedAt: new Date() })),
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId, name: "My Portfolio" },
    { $setOnInsert: { userId, name: "My Portfolio", isDefault: true, baseCurrency: "INR" } },
    { upsert: true, returnDocument: "after" },
  );

  const existingTx = await Transaction.countDocuments({ portfolioId: portfolio._id });
  if (existingTx === 0) {
    const now = Date.now();
    await Transaction.insertMany(
      SAMPLE_HOLDINGS.map((h) => ({
        userId,
        portfolioId: portfolio._id,
        symbol: h.symbol,
        side: "buy",
        quantity: h.quantity,
        price: h.price,
        fees: Math.round(h.quantity * h.price * 0.0005 * 100) / 100,
        tradedAt: new Date(now - h.daysAgo * 86_400_000),
        notes: "Seeded demo transaction",
      })),
    );
    // A partial sell so realised P&L is non-trivial.
    await Transaction.create({
      userId,
      portfolioId: portfolio._id,
      symbol: "ITC",
      side: "sell",
      quantity: 20,
      price: 470,
      fees: 4.7,
      tradedAt: new Date(now - 30 * 86_400_000),
      notes: "Seeded demo partial sale",
    });
  }

  await PaperAccount.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, startingCash: 1_000_000, cash: 1_000_000, lastResetAt: new Date() } },
    { upsert: true },
  );
  const existingTrades = await PaperTrade.countDocuments({ userId });
  if (existingTrades === 0) {
    await PaperTrade.create([
      { userId, symbol: "TATAMOTORS", side: "buy", quantity: 15, fillPrice: 990, grossValue: 14850, fees: 7.42, tradedAt: new Date(Date.now() - 10 * 86_400_000) },
      { userId, symbol: "SBIN", side: "buy", quantity: 40, fillPrice: 810, grossValue: 32400, fees: 16.2, tradedAt: new Date(Date.now() - 6 * 86_400_000) },
    ]);
    await PaperAccount.updateOne({ userId }, { $inc: { cash: -(14850 + 7.42 + 32400 + 16.2) } });
  }

  const existingAlerts = await Alert.countDocuments({ userId });
  if (existingAlerts === 0) {
    await Alert.create([
      { userId, symbol: "RELIANCE", type: "price_above", threshold: 3200, note: "Watch for breakout" },
      { userId, symbol: "INFY", type: "pct_change_below", threshold: -3, note: "Downside move" },
    ]);
  }

  const existingNotes = await ResearchNote.countDocuments({ userId });
  if (existingNotes === 0) {
    await ResearchNote.create({
      userId,
      symbol: "TCS",
      title: "Earnings checklist",
      content: "Track deal wins, margin trajectory and attrition in the next quarterly result. Seeded demo note.",
    });
  }

  const existingNotifications = await Notification.countDocuments({ userId });
  if (existingNotifications === 0) {
    await Notification.create({
      userId,
      type: "system",
      title: "Welcome to Nivesh Terminal",
      body: "This is seeded demo data. Market data may be simulated depending on the configured provider.",
    });
  }

  logger.info(
    { email: DEMO_EMAIL, watchlist: watchlist?.name, portfolio: portfolio?.name },
    "demo seed complete",
  );
  await disconnectDatabase();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "seed failed");
    process.exit(1);
  });
