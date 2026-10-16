/**
 * Shared domain error type with an HTTP status, a stable machine-readable code,
 * and optional structured details. Controllers/services throw these; the global
 * error handler converts them into the standard API error envelope.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options: { details?: unknown; expose?: boolean } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
    this.expose = options.expose ?? statusCode < 500;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message = "Invalid request", details?: unknown) {
    return new AppError(400, "BAD_REQUEST", message, { details });
  }
  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Not allowed") {
    return new AppError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new AppError(404, "NOT_FOUND", message);
  }
  static conflict(message = "Conflict", details?: unknown) {
    return new AppError(409, "CONFLICT", message, { details });
  }
  static tooMany(message = "Too many requests") {
    return new AppError(429, "RATE_LIMITED", message);
  }
  static upstream(message = "Upstream data provider error", details?: unknown) {
    return new AppError(502, "UPSTREAM_ERROR", message, { details });
  }
  static unavailable(message = "Service unavailable", details?: unknown) {
    return new AppError(503, "SERVICE_UNAVAILABLE", message, { details });
  }
  static internal(message = "Internal server error") {
    return new AppError(500, "INTERNAL_ERROR", message, { expose: false });
  }
}
