import { Router } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { signAccessToken, signRefreshToken } from '../services/tokenService.js';
import { sendEmail } from '../services/emailService.js';
import { verifyTotpToken, verifyAndUseBackupCode } from '../services/twoFactorService.js';
import { logger } from '../config/logger.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

/**
 * Professional OTP email template — branded Cloploy design.
 */
function buildOtpEmailHtml(otp, purpose = 'verification') {
  const title = purpose === 'login' ? 'Login Verification' : 'Registration Verification';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09060F;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09060F;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="500" cellspacing="0" cellpadding="0" style="background:linear-gradient(145deg,#0d0a18 0%,#12101e 100%);border-radius:24px;border:1px solid #6E3FF3;overflow:hidden;">
          <!-- Header gradient bar -->
          <tr><td style="height:4px;background:linear-gradient(90deg,#6E3FF3,#F6C453,#00E5FF);"></td></tr>
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:35px 30px 15px;">
              <span style="font-size:30px;font-weight:800;color:#F6C453;letter-spacing:3px;">CLOPLOY</span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 30px 8px;">
              <h2 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${title}</h2>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td align="center" style="padding:0 30px 30px;">
              <p style="margin:0;font-size:15px;color:#a0a0a0;line-height:1.5;">Enter the following code to verify your identity.</p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding:0 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:rgba(110,63,243,0.12);border:2px solid rgba(110,63,243,0.35);border-radius:16px;padding:20px 40px;">
                    <span style="font-size:38px;font-weight:800;color:#F6C453;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td align="center" style="padding:0 30px 15px;">
              <p style="margin:0;font-size:13px;color:#888;">This code expires in <strong style="color:#F6C453;">10 minutes</strong>.</p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td align="center" style="padding:0 30px 30px;">
              <p style="margin:0;font-size:11px;color:#555;line-height:1.5;">If you did not request this code, please ignore this email.<br/>Never share this code with anyone.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 30px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 30px;">
              <p style="margin:0;font-size:10px;color:#444;">© ${year} Cloploy Platform — Claimed by Tharaneesh</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      const existing = await User.findOne({ email: req.body.email });
      if (existing) {
        if (existing.isEmailVerified) {
          return res.status(409).json({ message: 'Email already exists' });
        }
        existing.name = req.body.name;
        existing.password = req.body.password;
        await existing.save();
      }

      const user = existing || await User.create(req.body);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      logger.info(`[OTP VERIFICATION] Registration Code for ${user.email} is: ${otp}`);

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Verify your Cloploy registration',
        html: buildOtpEmailHtml(otp, 'registration')
      });

      res.status(200).json({
        requiresOtp: true,
        email: user.email,
        emailSent: emailResult.success,
        devOtp: emailResult.success ? undefined : otp
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── VERIFY REGISTRATION OTP ─────────────────────────────────────────────────
router.post('/verify-otp',
  [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.otpCode !== req.body.otp || user.otpExpiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      user.isEmailVerified = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      res.status(200).json({ user, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  }
);

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      logger.info(`[OTP VERIFICATION] Login Code for ${user.email} is: ${otp}`);

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Your Cloploy 2FA Login Code',
        html: buildOtpEmailHtml(otp, 'login')
      });

      res.json({
        requiresOtp: true,
        email: user.email,
        requiresTwoFactor: user.twoFactorEnabled,
        emailSent: emailResult.success,
        devOtp: emailResult.success ? undefined : otp
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── VERIFY LOGIN OTP ────────────────────────────────────────────────────────
router.post('/verify-login-otp',
  [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.otpCode !== req.body.otp || user.otpExpiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      if (user.twoFactorEnabled) {
        const tempToken = signAccessToken(user);
        return res.status(200).json({
          requiresTwoFactor: true,
          tempToken,
          email: user.email,
          message: 'Please provide your 2FA code'
        });
      }

      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      res.status(200).json({ user, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  }
);

// ─── VERIFY TOTP (2FA) ──────────────────────────────────────────────────────
router.post('/verify-totp', authenticate,
  [body('totpCode').isLength({ min: 6, max: 6 }).isNumeric().optional()],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ _id: req.user._id });
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled for this account' });
      }

      const { totpCode, backupCode } = req.body;
      let isValid = false;

      if (totpCode) {
        isValid = verifyTotpToken(user.twoFactorSecret, totpCode);
      } else if (backupCode) {
        isValid = verifyAndUseBackupCode(user.twoFactorBackupCodes, backupCode);
        if (isValid) await user.save();
      }

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }

      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      res.status(200).json({ success: true, user, accessToken, refreshToken, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Helper to dynamically resolve client url origin
const getClientUrl = (req) => {
  const referer = req.get('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch (e) {
      // ignore
    }
  }
  return env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
};

// ─── GOOGLE OAUTH REDIRECT ──────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const clientUrl = getClientUrl(req);
  const googleClientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  
  if (googleClientId && googleClientId !== 'placeholder' && !googleClientId.startsWith('YOUR_')) {
    const callbackUrl = env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || `${clientUrl}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
    return res.redirect(googleAuthUrl);
  } else {
    // Redirect to simulated Google Sign-in page
    return res.redirect(`${clientUrl}/google-login-simulation`);
  }
});

// ─── GOOGLE OAUTH CALLBACK ──────────────────────────────────────────────────
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const clientUrl = getClientUrl(req);
    
    if (!code) {
      return res.redirect(`${clientUrl}/login?error=Google authentication failed`);
    }
    
    const googleClientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || `${clientUrl}/api/auth/google/callback`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Google authorization code');
    }
    
    const tokenData = await tokenResponse.json();
    
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch Google user info');
    }
    
    const googleUser = await userResponse.json();
    const { email, name } = googleUser;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, isEmailVerified: true, onboarded: false });
    }
    
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    
    // Redirect user to the frontend with token query parameter
    res.redirect(`${clientUrl}/login?token=${accessToken}`);
  } catch (error) {
    logger.error(`Google callback error: ${error.message}`);
    const clientUrl = getClientUrl(req);
    res.redirect(`${clientUrl}/login?error=Google authentication failed`);
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post('/forgot-password',
  [body('email').isEmail()],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.json({ message: 'If the account exists, a reset link has been sent.' });

      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'Reset your Cloploy password',
        html: buildOtpEmailHtml(token, 'password-reset')
      });
      res.json({ message: 'If the account exists, a reset link has been sent.' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
router.post('/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        resetPasswordToken: req.body.token,
        resetPasswordExpiresAt: { $gt: new Date() }
      });
      if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GOOGLE LOGIN ────────────────────────────────────────────────────────────
router.post('/google-login',
  [body('email').isEmail(), body('name').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, name } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ name, email, isEmailVerified: true, onboarded: false });
      }
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      res.json({ user, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  }
);

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
router.post('/onboard', authenticate, async (req, res, next) => {
  try {
    const { githubUsername, githubAccessToken } = req.body;
    if (!githubUsername) {
      return res.status(400).json({ message: 'GitHub account connection is required to deploy applications. Please connect your GitHub account to continue.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.githubCredentials = { username: githubUsername, accessToken: githubAccessToken || '' };
    user.onboarded = true;
    await user.save();

    res.json({ message: 'Onboarding completed successfully!', user });
  } catch (error) {
    next(error);
  }
});

// ─── RESEND OTP ──────────────────────────────────────────────────────────────
router.post('/resend-otp',
  [body('email').isEmail()],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      logger.info(`[OTP VERIFICATION] Resent Code for ${user.email} is: ${otp}`);

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Your new Cloploy verification code',
        html: buildOtpEmailHtml(otp, 'verification')
      });

      res.json({ success: emailResult.success, message: emailResult.success ? 'OTP resent successfully' : 'Failed to resend OTP' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
