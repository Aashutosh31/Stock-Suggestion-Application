import type { Types } from "mongoose";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/errors.js";
import { findInstrument } from "../market/universe.js";
import { marketService } from "../market/market.service.js";
import { computeTechnicalSnapshot } from "../market/indicators.js";
import { isMailEnabled, sendMail } from "../notifications/mail.service.js";
import { Alert, type AlertDoc, type AlertType, Notification } from "./alert.model.js";
import { User } from "../users/user.model.js";

export async function listAlerts(userId: Types.ObjectId) {
  return Alert.find({ userId }).sort({ createdAt: -1 });
}

export async function createAlert(
  userId: Types.ObjectId,
  input: { symbol: string; type: AlertType; threshold: number; note?: string | null },
) {
  const symbol = input.symbol.toUpperCase();
  if (!findInstrument(symbol)) throw AppError.badRequest(`Unknown instrument: ${input.symbol}`);
  const duplicate = await Alert.findOne({ userId, symbol, type: input.type, threshold: input.threshold });
  if (duplicate) throw AppError.conflict("An identical alert already exists");
  const count = await Alert.countDocuments({ userId });
  if (count >= 100) throw AppError.badRequest("Alert limit reached (100)");
  return Alert.create({ userId, symbol, type: input.type, threshold: input.threshold, note: input.note ?? null });
}

export async function updateAlert(
  userId: Types.ObjectId,
  id: string,
  patch: Partial<{ threshold: number; status: "active" | "paused" | "triggered"; note: string | null }>,
): Promise<AlertDoc> {
  const alert = await Alert.findOne({ _id: id, userId });
  if (!alert) throw AppError.notFound("Alert not found");
  Object.assign(alert, patch);
  await alert.save();
  return alert;
}

export async function deleteAlert(userId: Types.ObjectId, id: string) {
  const result = await Alert.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) throw AppError.notFound("Alert not found");
}

function conditionMet(alert: AlertDoc, observed: number): boolean {
  switch (alert.type) {
    case "price_above":
    case "pct_change_above":
    case "volume_above":
    case "rsi_above":
      return observed >= alert.threshold;
    case "price_below":
    case "pct_change_below":
    case "rsi_below":
      return observed <= alert.threshold;
    default:
      return false;
  }
}

function describe(alert: AlertDoc, observed: number): string {
  const labels: Record<AlertType, string> = {
    price_above: "price rose to/above",
    price_below: "price fell to/below",
    pct_change_above: "day change reached/above",
    pct_change_below: "day change fell to/below",
    volume_above: "volume reached/above",
    rsi_above: "RSI(14) reached/above",
    rsi_below: "RSI(14) fell to/below",
  };
  const unit = alert.type.startsWith("pct") || alert.type.startsWith("rsi") ? "%" : "";
  return `${alert.symbol}: ${labels[alert.type]} ${observed.toFixed(2)}${unit} (threshold ${alert.threshold}${unit})`;
}

export interface EvaluationResult {
  checked: number;
  triggered: number;
  channel: "in-app" | "in-app+email";
  emailEnabled: boolean;
}

/**
 * Evaluates active alerts against the latest available data. This runs on a
 * periodic cadence (see server scheduler) — it is polling, NOT real-time
 * streaming, and that limitation is surfaced in the API/docs.
 */
export async function evaluateAlerts(userId?: Types.ObjectId): Promise<EvaluationResult> {
  const query = userId ? { userId, status: "active" as const } : { status: "active" as const };
  const alerts = await Alert.find(query).limit(500);
  let triggered = 0;
  const rsiCache = new Map<string, number | null>();

  const bySymbol = new Map<string, AlertDoc[]>();
  for (const a of alerts) {
    const list = bySymbol.get(a.symbol) ?? [];
    list.push(a);
    bySymbol.set(a.symbol, list);
  }

  for (const [symbol, symbolAlerts] of bySymbol) {
    let quote;
    try {
      quote = await marketService.getQuote(symbol);
    } catch (err) {
      logger.debug({ symbol, err: (err as Error).message }, "alert evaluation: quote unavailable");
      continue;
    }
    for (const alert of symbolAlerts) {
      let observed: number | null = null;
      if (alert.type === "price_above" || alert.type === "price_below") observed = quote.price;
      else if (alert.type === "pct_change_above" || alert.type === "pct_change_below") observed = quote.changePercent;
      else if (alert.type === "volume_above") observed = quote.volume;
      else if (alert.type === "rsi_above" || alert.type === "rsi_below") {
        if (!rsiCache.has(symbol)) {
          try {
            const history = await marketService.getHistory(symbol, "1y", "1d");
            rsiCache.set(symbol, computeTechnicalSnapshot(history.candles).rsi14);
          } catch {
            rsiCache.set(symbol, null);
          }
        }
        observed = rsiCache.get(symbol) ?? null;
      }

      alert.lastCheckedAt = new Date();
      if (observed === null) {
        await alert.save();
        continue;
      }
      if (conditionMet(alert, observed)) {
        triggered++;
        alert.status = "triggered";
        alert.triggeredAt = new Date();
        alert.triggerCount += 1;
        alert.triggerHistory.push({ at: new Date(), observedValue: observed, message: describe(alert, observed) });
        if (alert.triggerHistory.length > 25) alert.triggerHistory = alert.triggerHistory.slice(-25);
        const user = await User.findById(alert.userId);
        if (user) {
          await Notification.create({
            userId: alert.userId,
            type: "alert",
            title: `Alert: ${alert.symbol}`,
            body: describe(alert, observed),
            symbol: alert.symbol,
          });
          if (user.preferences.notifications.email && isMailEnabled()) {
            await sendMail({
              to: user.email,
              subject: `[Nivesh] Alert triggered for ${alert.symbol}`,
              text: describe(alert, observed),
            });
          }
        }
      }
      await alert.save();
    }
  }

  return {
    checked: alerts.length,
    triggered,
    channel: isMailEnabled() ? "in-app+email" : "in-app",
    emailEnabled: isMailEnabled(),
  };
}
