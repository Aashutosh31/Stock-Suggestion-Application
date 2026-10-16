import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { evaluateAlerts } from "./modules/alerts/alert.service.js";

async function main(): Promise<void> {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV, provider: env.MARKET_DATA_PROVIDER },
      `${env.APP_NAME} API listening`,
    );
    if (env.MARKET_DATA_PROVIDER === "demo") {
      logger.warn("Market data provider is DEMO — quotes are simulated, not live market data.");
    }
  });

  // Alert evaluation runs on a fixed polling cadence. This is NOT real-time
  // streaming; the interval is surfaced via the API and docs.
  const ALERT_INTERVAL_MS = 60_000;
  const alertTimer = setInterval(() => {
    evaluateAlerts().catch((err) => logger.error({ err: (err as Error).message }, "alert evaluation failed"));
  }, ALERT_INTERVAL_MS);
  alertTimer.unref();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down gracefully");
    clearInterval(alertTimer);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason: reason instanceof Error ? reason.message : String(reason) }, "unhandled rejection");
  });
}

main().catch((err) => {
  logger.fatal({ err: err instanceof Error ? err.message : String(err) }, "failed to start server");
  process.exit(1);
});
