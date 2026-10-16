import type { Response } from "express";
import type { AppError } from "./errors.js";

/**
 * Standard success envelope used by every endpoint.
 *   { success: true, data, meta? }
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiSuccess<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function errorPayload(err: AppError): ApiError {
  return {
    success: false,
    error: {
      code: err.code,
      message: err.expose ? err.message : "Internal server error",
      ...(err.expose && err.details !== undefined ? { details: err.details } : {}),
    },
  };
}
