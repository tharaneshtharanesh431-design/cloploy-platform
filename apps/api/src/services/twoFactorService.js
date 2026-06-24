import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Generate 2FA secret and return QR code
 */
export async function generateTwoFactorSecret(email, appName = 'Cloploy') {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    issuer: appName,
    length: 32
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
    otpauthUrl: secret.otpauth_url,
    backupCodes: generateBackupCodes(10)
  };
}

/**
 * Verify TOTP token
 */
export function verifyTotpToken(secret, token) {
  if (!secret || !token) return false;

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time windows before/after current time
  });

  return verified;
}

/**
 * Verify backup code and remove it from list
 */
export function verifyAndUseBackupCode(backupCodes, code) {
  const index = backupCodes.indexOf(code.toUpperCase());
  if (index === -1) return false;

  // Remove used code
  backupCodes.splice(index, 1);
  return true;
}

/**
 * Generate new TOTP token (for testing)
 */
export function generateTotpToken(secret) {
  if (!secret) return null;

  return speakeasy.totp({
    secret,
    encoding: 'base32'
  });
}
