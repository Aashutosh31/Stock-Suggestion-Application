import { pino } from "pino";
import { env } from "./env.js";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "password",
  "passwordHash",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "refreshToken",
  "resetToken",
  "verificationToken",
  "apiKey",
  "GROQ_API_KEY",
  "SMTP_PASSWORD",
  "MONGODB_URI",
  "*.password",
  "*.passwordHash",
  "*.token",
];

export const logger = pino({
  level: env.isTest ? "silent" : env.LOG_LEVEL,
  redact: { paths: redactPaths, censor: "[redacted]" },
  base: { service: "nivesh-api", env: env.NODE_ENV },
  transport:
    env.isProduction || env.isTest
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname,service,env" },
        },
});

export type Logger = typeof logger;
