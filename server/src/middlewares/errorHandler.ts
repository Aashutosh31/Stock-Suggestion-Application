import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/errors.js";
import { errorPayload } from "../utils/http.js";

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

function normalize(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return AppError.badRequest(
      "Validation failed",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return AppError.badRequest(
      "Validation failed",
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest("Invalid identifier or value");
  }

  const mongoErr = err as MongoServerError;
  if (mongoErr?.code === 11000) {
    return AppError.conflict("A record with these values already exists", {
      fields: Object.keys(mongoErr.keyValue ?? {}),
    });
  }

  if (err instanceof Error && err.message.includes("CORS")) {
    return AppError.forbidden("Origin not allowed");
  }

  return AppError.internal();
}

/**
 * Global error handler. Produces the standard error envelope, logs server-side
 * details, and never leaks stack traces or internal messages to clients.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const appError = normalize(err);
  const log = appError.statusCode >= 500 ? logger.error : logger.warn;
  log.call(
    logger,
    {
      code: appError.code,
      status: appError.statusCode,
      path: req.originalUrl,
      method: req.method,
      err: err instanceof Error ? err.message : String(err),
      ...(appError.statusCode >= 500 && err instanceof Error && !env.isProduction
        ? { stack: err.stack }
        : {}),
    },
    "request failed",
  );
  res.status(appError.statusCode).json(errorPayload(appError));
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}
