import "dotenv/config";
import { z } from "zod";

const boolFromString = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? def : v.toLowerCase() === "true"));

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v.trim()));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default("0.0.0.0"),
  APP_NAME: z.string().default("Nivesh Terminal"),
  API_PREFIX: z.string().default("/api/v1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  TRUST_PROXY: boolFromString(false),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  COOKIE_DOMAIN: optionalString,
  COOKIE_SECURE: boolFromString(false),
  // Cross-site SPA+API deployments (e.g. Vercel frontend + Render backend) need "none".
  // Omit to keep the safe default: "strict" in production, "lax" in development.
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).optional(),

  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

  MARKET_DATA_PROVIDER: z.enum(["demo", "yahoo"]).default("demo"),
  MARKET_DATA_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(8000),
  MARKET_DATA_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  QUOTE_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(30),
  HISTORY_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(300),
  SEARCH_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(3600),
  FUNDAMENTALS_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).default(3600),

  MAIL_ENABLED: boolFromString(false),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: boolFromString(false),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  MAIL_FROM: z.string().default("Nivesh Terminal <no-reply@nivesh.local>"),

  AI_EXPLAIN_ENABLED: boolFromString(false),
  // Groq (OpenAI-compatible). Model defaults to the openai/gpt-oss-120b open-weights model.
  GROQ_API_KEY: optionalString,
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),

  ADMIN_DIAGNOSTICS_TOKEN: optionalString,
});

export type AppEnv = z.infer<typeof envSchema> & {
  isProduction: boolean;
  isTest: boolean;
  clientOrigins: string[];
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  // Fail fast with an actionable message. No secrets are printed.
  // eslint-disable-next-line no-console
  console.error(`\n[config] Invalid environment configuration:\n${issues}\n\nSee server/.env.example for the full list of variables.\n`);
  process.exit(1);
}

const data = parsed.data;
const isProduction = data.NODE_ENV === "production";

if (isProduction) {
  const problems: string[] = [];
  if (data.JWT_ACCESS_SECRET.startsWith("replace-with")) problems.push("JWT_ACCESS_SECRET is still the placeholder value");
  if (data.JWT_REFRESH_SECRET.startsWith("replace-with")) problems.push("JWT_REFRESH_SECRET is still the placeholder value");
  if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) problems.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ");
  if (!data.COOKIE_SECURE) problems.push("COOKIE_SECURE must be true in production");
  if (data.COOKIE_SAMESITE === "none" && !data.COOKIE_SECURE)
    problems.push('COOKIE_SAMESITE="none" requires COOKIE_SECURE=true');
  if (problems.length) {
    // eslint-disable-next-line no-console
    console.error(`\n[config] Refusing to start in production:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`);
    process.exit(1);
  }
}

export const env: AppEnv = {
  ...data,
  isProduction,
  isTest: data.NODE_ENV === "test",
  clientOrigins: data.CLIENT_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
