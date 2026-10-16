/**
 * Vitest setup — runs before every test file. Configures a deterministic test
 * environment so config/env.ts validates without touching real secrets.
 */
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/nivesh_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-value-0123456789";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-value-0123456789";
process.env.BCRYPT_ROUNDS = "8";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.MARKET_DATA_PROVIDER = "demo";
process.env.LOG_LEVEL = "silent";
process.env.MAIL_ENABLED = "false";
process.env.AI_EXPLAIN_ENABLED = "false";
