# Two-Factor Authentication (2FA) - Implementation Guide

## Overview

Two-Factor Authentication (2FA) has been successfully implemented in the Cloploy platform using TOTP (Time-based One-Time Password) technology. This provides an additional layer of security for user accounts.

## Features Implemented

### 1. **TOTP-Based 2FA**
   - Uses industry-standard TOTP authentication
   - Compatible with popular authenticator apps:
     - Google Authenticator
     - Microsoft Authenticator
     - Authy
     - 1Password
     - LastPass
     - FreeOTP

### 2. **Backup Codes**
   - 10 backup codes generated during 2FA setup
   - Can be used if authenticator device is lost/unavailable
   - Codes are one-time use only
   - Can be regenerated anytime

### 3. **Email-based OTP + TOTP 2FA**
   - First factor: Email verification code (already implemented)
   - Second factor: TOTP from authenticator app (newly added)
   - Seamless multi-factor authentication flow

### 4. **Account Security**
   - 2FA can be enabled/disabled with password confirmation
   - Backup codes are stored securely
   - Automatic code expiration and validation

## User Guide

### Enabling 2FA

1. **Navigate to Security Settings**
   - Log in to your account
   - Go to `/settings/security`

2. **Start 2FA Setup**
   - Click "Enable Two-Factor Authentication"
   - A QR code and secret key will be displayed

3. **Scan QR Code**
   - Open your authenticator app (Google Authenticator, Authy, etc.)
   - Scan the QR code displayed
   - The app will generate a 6-digit code

4. **Verify Setup**
   - Enter the 6-digit code from your authenticator
   - Click "Verify & Continue"

5. **Save Backup Codes**
   - You'll receive 10 backup codes
   - Store these in a secure location
   - You can use these codes if you lose access to your authenticator

6. **Confirmation**
   - 2FA is now enabled
   - You'll need to provide a TOTP code during login

### Disabling 2FA

1. Go to Security Settings (`/settings/security`)
2. Click "Disable 2FA"
3. Enter your password to confirm
4. 2FA will be disabled immediately

### Using Backup Codes

If you lose access to your authenticator app:

1. During login, after email verification, click "Use backup code instead"
2. Enter one of your backup codes
3. Each code can only be used once

### Regenerating Backup Codes

1. Go to Security Settings
2. Click "Regenerate backup codes"
3. Enter your TOTP code to verify
4. New codes will be generated and the old ones invalidated

## API Endpoints

### Setup 2FA
```
GET /api/2fa/setup
Authentication: Required
Returns: QR code, secret, backup codes
```

### Verify Setup
```
POST /api/2fa/verify-setup
Body: { token: "123456" }
Authentication: Required
Returns: Success message, backup codes
```

### Get 2FA Status
```
GET /api/2fa/status
Authentication: Required
Returns: enabled, verifiedAt, backupCodesRemaining
```

### Disable 2FA
```
POST /api/2fa/disable
Body: { password: "user_password" }
Authentication: Required
Returns: Success message
```

### Regenerate Backup Codes
```
POST /api/2fa/regenerate-backup-codes
Body: { token: "123456" }
Authentication: Required
Returns: New backup codes
```

### Verify TOTP During Login
```
POST /api/auth/verify-totp
Body: { totpCode: "123456" } OR { backupCode: "XXXXXXXX" }
Authentication: Required (temp token)
Returns: User, accessToken, refreshToken
```

## Login Flow with 2FA

1. **Step 1: Email & Password**
   - User enters email and password
   - System validates credentials

2. **Step 2: Email OTP Verification**
   - 6-digit code sent to registered email
   - User enters the code
   - System checks if 2FA is enabled

3. **Step 3: TOTP Verification** (if 2FA enabled)
   - User enters 6-digit code from authenticator
   - OR uses a backup code
   - System validates and completes login

## Frontend Components

### SecuritySettingsPage
- Location: `src/pages/SecuritySettingsPage.jsx`
- Features:
  - Display 2FA status
  - Enable/disable 2FA
  - Manage backup codes
  - Secure password confirmation

### TwoFactorSetup
- Location: `src/components/security/TwoFactorSetup.jsx`
- Features:
  - QR code display
  - Manual secret key entry
  - Code verification
  - Backup code display

### TwoFactorVerification
- Location: `src/components/security/TwoFactorVerification.jsx`
- Features:
  - TOTP code input
  - Backup code input
  - Code validation
  - Error handling

## Backend Components

### twoFactorService.js
- Location: `src/services/twoFactorService.js`
- Functions:
  - `generateTwoFactorSecret()` - Generate QR and secret
  - `verifyTotpToken()` - Verify TOTP code
  - `generateBackupCodes()` - Generate 10 backup codes
  - `verifyAndUseBackupCode()` - Verify and consume backup code
  - `generateTotpToken()` - Generate token for testing

### twofa.routes.js
- Location: `src/routes/twofa.routes.js`
- Endpoints for setup, verification, status, and management

### Updated User Model
- New fields:
  - `twoFactorEnabled` - Boolean flag
  - `twoFactorSecret` - TOTP secret key
  - `twoFactorBackupCodes` - Array of backup codes
  - `twoFactorVerifiedAt` - Timestamp of verification

## Security Considerations

### Best Practices
1. **Backup Codes**: Store securely in password manager or offline
2. **Time Sync**: Ensure device clock is accurate for TOTP
3. **Secret Key**: Never share your secret key
4. **Authenticator Apps**: Keep app updated
5. **Account Recovery**: Save backup codes separately

### Technical Security
- TOTP uses HMAC-SHA1 algorithm
- 30-second time window
- Allow ±2 time windows for clock skew
- Backup codes are stored as plain text (consider hashing in production)
- Temporary tokens are JWT-based with limited validity

## Dependencies

### Backend
- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation

### Frontend
- React
- Redux for state management
- Framer Motion for animations

## Installation

### Backend
```bash
npm install speakeasy qrcode
```

### Frontend
Dependencies already included in the project.

## Testing

### Manual Testing Steps

1. **Enable 2FA**
   - Navigate to security settings
   - Enable 2FA
   - Verify with authenticator app code

2. **Login with 2FA**
   - Log out
   - Log in with credentials
   - Verify email OTP
   - Verify TOTP code

3. **Test Backup Codes**
   - Login with backup code
   - Verify code is consumed

4. **Disable 2FA**
   - Navigate to security settings
   - Disable 2FA with password
   - Verify 2FA is no longer required on login

## Future Enhancements

1. **WebAuthn/FIDO2**
   - Hardware key support
   - Biometric authentication

2. **SMS-based 2FA**
   - SMS code delivery
   - Phone number verification

3. **Push Notifications**
   - App-based push notifications
   - Mobile app integration

4. **Device Trust**
   - Remember device for 30 days
   - Trusted device management

5. **Audit Logging**
   - Log all 2FA activities
   - Failed attempts tracking

6. **Admin Controls**
   - Enforce 2FA for all users
   - Override/reset user 2FA
   - View user 2FA status

## Troubleshooting

### Code Not Working
- Ensure device time is accurate
- Check if app is displaying current time
- Try code within ±30 seconds of current time

### Lost Access to Authenticator
- Use backup codes to login
- Disable 2FA with password
- Re-enable and setup new authenticator

### Codes Expiring Too Quickly
- Sync device time
- Check server time is correct
- TOTP tokens valid for 30 seconds

## Support

For issues or questions:
1. Check troubleshooting section
2. Review security settings page help
3. Contact support with details

---

**Last Updated**: 2026-06-15
**Version**: 1.0.0
**Status**: Production Ready
