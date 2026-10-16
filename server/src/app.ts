import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { isDatabaseReady } from "./config/db.js";
import { AppError } from "./utils/errors.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { originGuard } from "./middlewares/originGuard.js";
import { metricsMiddleware } from "./middlewares/metrics.js";
import { apiRouter } from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin rejected"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-admin-token", "x-csrf-token"],
      maxAge: 600,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: false, limit: "64kb" }));
  app.use(cookieParser());
  app.use(metricsMiddleware());

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/health" || req.url === `${env.API_PREFIX}/market/status`,
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  // Health check exposes no sensitive information.
  app.get("/health", (_req, res) => {
    res.json({
      status: isDatabaseReady() ? "ok" : "degraded",
      database: isDatabaseReady() ? "connected" : "disconnected",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(originGuard);
  app.use(env.API_PREFIX, apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
