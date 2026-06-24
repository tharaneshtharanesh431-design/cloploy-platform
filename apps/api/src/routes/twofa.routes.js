import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import {
  generateTwoFactorSecret,
  verifyTotpToken,
  verifyAndUseBackupCode
} from '../services/twoFactorService.js';

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

/**
 * Generate 2FA setup QR code and secret
 * GET /2fa/setup
 */
router.get('/setup', authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        message: '2FA is already enabled for this account'
      });
    }

    const { secret, qrCode, backupCodes } = await generateTwoFactorSecret(user.email);

    // Store temporary secret (not yet verified)
    req.session = req.session || {};
    req.session.tempTwoFactorSecret = secret;
    req.session.tempBackupCodes = backupCodes;

    res.json({
      qrCode,
      secret,
      backupCodes,
      message: 'Scan the QR code with your authenticator app'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify and enable 2FA
 * POST /2fa/verify-setup
 */
router.post(
  '/verify-setup',
  authenticate,
  [body('token').isLength({ min: 6, max: 6 }).isNumeric()],
  validate,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { token } = req.body;

      // Get temp secret from request or generate new one
      let secret = req.session?.tempTwoFactorSecret;

      if (!secret) {
        return res.status(400).json({
          message: 'Please start the 2FA setup process first'
        });
      }

      // Verify the token
      const isValid = verifyTotpToken(secret, token);

      if (!isValid) {
        return res.status(401).json({
          message: 'Invalid verification code. Please try again.'
        });
      }

      // Save 2FA to user
      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret;
      user.twoFactorBackupCodes = req.session.tempBackupCodes || [];
      user.twoFactorVerifiedAt = new Date();
      await user.save();

      // Clear session
      if (req.session) {
        req.session.tempTwoFactorSecret = null;
        req.session.tempBackupCodes = null;
      }

      res.json({
        success: true,
        message: '2FA has been successfully enabled!',
        backupCodes: user.twoFactorBackupCodes
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Disable 2FA
 * POST /2fa/disable
 */
router.post(
  '/disable',
  authenticate,
  [body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { password } = req.body;

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          message: 'Invalid password'
        });
      }

      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();

      res.json({
        success: true,
        message: '2FA has been disabled'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get 2FA status
 * GET /2fa/status
 */
router.get('/status', authenticate, async (req, res) => {
  const user = req.user;
  res.json({
    enabled: user.twoFactorEnabled,
    verifiedAt: user.twoFactorVerifiedAt,
    backupCodesRemaining: user.twoFactorBackupCodes?.length || 0
  });
});

/**
 * Regenerate backup codes
 * POST /2fa/regenerate-backup-codes
 */
router.post(
  '/regenerate-backup-codes',
  authenticate,
  [body('token').isLength({ min: 6, max: 6 }).isNumeric()],
  validate,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { token } = req.body;

      if (!user.twoFactorEnabled) {
        return res.status(400).json({
          message: '2FA is not enabled'
        });
      }

      // Verify current TOTP token
      const isValid = verifyTotpToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(401).json({
          message: 'Invalid verification code'
        });
      }

      // Generate new backup codes
      const { backupCodes: newBackupCodes } = await generateTwoFactorSecret(user.email);
      user.twoFactorBackupCodes = newBackupCodes;
      await user.save();

      res.json({
        success: true,
        message: 'Backup codes regenerated',
        backupCodes: newBackupCodes
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
