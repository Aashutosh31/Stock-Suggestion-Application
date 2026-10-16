import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.MAIL_ENABLED || !env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export function isMailEnabled(): boolean {
  return env.MAIL_ENABLED && Boolean(env.SMTP_HOST);
}

/**
 * Sends an email when a mail provider is configured. When mail is disabled the
 * message is logged at debug level (body redacted in production) so local
 * development can still complete flows like password reset via the console.
 */
export async function sendMail(message: MailMessage): Promise<{ delivered: boolean; channel: string }> {
  const tx = getTransporter();
  if (!tx) {
    logger.info(
      { to: message.to, subject: message.subject, preview: env.isProduction ? undefined : message.text },
      "mail provider disabled — message not sent",
    );
    return { delivered: false, channel: "disabled" };
  }
  try {
    await tx.sendMail({ from: env.MAIL_FROM, ...message });
    return { delivered: true, channel: "smtp" };
  } catch (err) {
    logger.error({ err: (err as Error).message, to: message.to }, "failed to send mail");
    return { delivered: false, channel: "error" };
  }
}
