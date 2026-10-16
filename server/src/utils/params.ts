import type { Request } from "express";

/** Reads a single route parameter as a string (Express 5 params are string | string[]). */
export function routeParam(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
