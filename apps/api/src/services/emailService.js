import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;
let smtpVerified = false;

/**
 * Initialize and verify the SMTP transporter on server startup.
 */
const isRealKey = (key) => Boolean(key && !key.startsWith('YOUR_') && !key.includes('YOUR_REAL_') && key !== 'placeholder');

/**
 * Initialize and verify the SMTP transporter on server startup.
 */
export async function initEmailService() {
  const hasCreds = isRealKey(env.SMTP_HOST) && isRealKey(env.SMTP_USER) && isRealKey(env.SMTP_PASS);

  if (!hasCreds) {
    logger.warn('EMAIL SERVICE: SMTP credentials missing or placeholder in .env. Falling back to Ethereal Email for testing...');
    return await setupEtherealFallback();
  }

  try {
    // Explicit SMTP configuration is more reliable than Nodemailer's opaque service mappings
    const config = {
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(env.SMTP_PORT || 465),
      secure: Number(env.SMTP_PORT) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    };

    transporter = nodemailer.createTransport(config);

    await transporter.verify();
    smtpVerified = true;
    logger.info(`EMAIL SERVICE: SMTP verified — ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}`);
    return true;
  } catch (err) {
    logger.error(`EMAIL SERVICE: SMTP verification failed — ${err.message}`);
    if (err.message.includes('Invalid login') || err.message.includes('535')) {
      logger.error('HINT: Use a Google App Password, not your regular password.');
    }
    logger.warn('EMAIL SERVICE: Falling back to Ethereal Email due to verification failure...');
    return await setupEtherealFallback();
  }
}

async function setupEtherealFallback() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    smtpVerified = true;
    logger.info('EMAIL SERVICE: Ethereal Sandbox created. Sent emails will log a preview URL.');
    return true;
  } catch (e) {
    logger.error('EMAIL SERVICE: Failed to create Ethereal account: ' + e.message);
    smtpVerified = false;
    transporter = null;
    return false;
  }
}

/**
 * Check if the email service is operational.
 */
export function isEmailReady() {
  return smtpVerified && transporter !== null;
}

/**
 * Send an email with automatic retry (up to 3 attempts with exponential backoff).
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendEmail({ to, subject, html, retries = 2 }) {
  if (!transporter || !smtpVerified) {
    logger.warn(`EMAIL: Skipped — SMTP not operational. Recipient: ${to}`);
    return { success: false, error: 'SMTP service not available' };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP_HOST ? `"Cloploy Platform" <${env.SMTP_USER}>` : '"Cloploy Local" <test@cloploy.app>',
        to,
        subject,
        html
      });

      logger.info(`EMAIL: Sent to ${to} | MessageID: ${info.messageId}`);
      if (!env.SMTP_HOST) {
        logger.info(`EMAIL PREVIEW: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      logger.error(`EMAIL: Attempt ${attempt}/${retries + 1} failed for ${to} — ${err.message}`);

      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  logger.error(`EMAIL: All attempts exhausted for ${to} — ${lastError.message}`);
  return { success: false, error: lastError.message };
}
