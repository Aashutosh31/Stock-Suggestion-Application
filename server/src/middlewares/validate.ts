import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/errors.js";

export interface RequestSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message }));
}

/**
 * Validates and REPLACES req.body / req.query / req.params with parsed,
 * typed values. Unknown keys are stripped by the schemas themselves.
 */
export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) throw AppError.badRequest("Invalid path parameters", formatIssues(parsed.error));
        req.params = parsed.data as Request["params"];
      }
      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) throw AppError.badRequest("Invalid query parameters", formatIssues(parsed.error));
        // Express 5 exposes req.query as a getter; stash parsed values separately.
        req.validatedQuery = parsed.data;
      }
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) throw AppError.badRequest("Invalid request body", formatIssues(parsed.error));
        req.body = parsed.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Returns the parsed query object set by validate() if present. */
export function validatedQuery<T>(req: Request): T {
  return (req as Request & { validatedQuery?: T }).validatedQuery as T;
}
