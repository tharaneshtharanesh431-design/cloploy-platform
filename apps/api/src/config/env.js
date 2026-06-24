import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../../.env');

dotenv.config({ path: envPath });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3121),

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost',

  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb://mongodb:27017/cloploy',

  REDIS_URL:
    process.env.REDIS_URL ||
    'redis://redis:6379',

  JWT_SECRET:
    process.env.JWT_SECRET ||
    'development-secret',

  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN ||
    '1d',

  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET ||
    'refresh-secret',

  REFRESH_TOKEN_EXPIRES_IN:
    process.env.REFRESH_TOKEN_EXPIRES_IN ||
    '7d',

  SESSION_SECRET:
    process.env.SESSION_SECRET ||
    'session-secret',

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  EMAIL_FROM:
    process.env.EMAIL_FROM ||
    'no-reply@cloploy.com',

  GITHUB_CLIENT_ID:
    process.env.GITHUB_CLIENT_ID,

  GITHUB_CLIENT_SECRET:
    process.env.GITHUB_CLIENT_SECRET,

  GITHUB_CALLBACK_URL:
    process.env.GITHUB_CALLBACK_URL,

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY,

  GEMINI_MODEL:
    process.env.GEMINI_MODEL ||
    'gemini-2.5-flash',

  CLAUDE_API_KEY:
    process.env.CLAUDE_API_KEY,

  CLAUDE_MODEL:
    process.env.CLAUDE_MODEL ||
    'claude-sonnet-4-20250514',

  OPENAI_API_KEY:
    process.env.OPENAI_API_KEY,

  OPENAI_MODEL:
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini',

  AWS_REGION:
    process.env.AWS_REGION ||
    'ap-south-1'
};