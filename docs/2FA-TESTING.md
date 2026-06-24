# 2FA Testing & Quick Start Guide

## 🚀 Quick Setup

### 1. Install Required Apps
Download one of these authenticator apps on your phone:
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Web)
- **1Password** (iOS/Android/Web)

### 2. Access Security Settings
```
URL: http://localhost:5174/settings/security
```

### 3. Enable 2FA
Click "Enable Two-Factor Authentication" button

## 📱 Setup Process

### Step 1: Scan QR Code
1. Open your authenticator app
2. Tap "Scan QR Code" (or + icon)
3. Point at the QR code displayed
4. App will show a 6-digit code

### Step 2: Verify Code
1. Type the 6-digit code from your authenticator
2. Click "Verify & Continue"

### Step 3: Save Backup Codes
1. Copy all 10 backup codes
2. Store in a secure location (password manager, safe, etc.)
3. Click "I've saved my backup codes"

## 🔐 Testing Login with 2FA

### Normal Login Flow
1. Go to http://localhost:5174/login
2. Enter email and password
3. Check console for OTP code (since email is not configured)
4. Enter the OTP code
5. **NEW**: Enter 6-digit code from authenticator app
6. Successfully logged in!

### Using Backup Code
1. Complete steps 1-4 above
2. When 2FA verification appears:
   - Click "Use backup code instead"
   - Enter one of your backup codes
   - Click "Verify Backup Code"

## 🧪 Development Testing

### Viewing OTP Codes in Console
During development, OTP codes are logged to the API console:
```
[OTP DEBUG] Login 2FA Verification code for email@example.com is: 123456
```

### Testing TOTP Generation
The 2FA service can generate test codes:
```javascript
import { generateTotpToken } from './services/twoFactorService.js';
const code = generateTotpToken(secretKey);
console.log(code); // outputs 6-digit code
```

### API Testing with cURL

#### Enable 2FA Setup
```bash
curl -X GET http://localhost:5000/api/2fa/setup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Verify 2FA Setup
```bash
curl -X POST http://localhost:5000/api/2fa/verify-setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"123456"}'
```

#### Get 2FA Status
```bash
curl -X GET http://localhost:5000/api/2fa/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Verify TOTP During Login
```bash
curl -X POST http://localhost:5000/api/auth/verify-totp \
  -H "Authorization: Bearer TEMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"totpCode":"123456"}'
```

#### Disable 2FA
```bash
curl -X POST http://localhost:5000/api/2fa/disable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'
```

## 🐛 Troubleshooting

### Code Always Invalid
**Problem**: Getting "Invalid 2FA code" even with correct code

**Solutions**:
1. Ensure device time is synchronized
2. Try code within ±30 seconds window
3. Check if authenticator app shows current time
4. Re-sync time in system settings

### Lost Authenticator Access
**Problem**: Lost phone or uninstalled authenticator app

**Solution**:
1. Use one of your backup codes during login
2. After logging in, disable 2FA from settings
3. Re-enable 2FA with new authenticator app

### Codes Expiring Too Fast
**Problem**: Code expires before you can enter it

**Solution**:
1. Check system clock accuracy
2. Sync with NTP time
3. Make sure server time is correct
4. TOTP tokens are valid for 30 seconds

## 📊 Feature Testing Checklist

### Setup
- [ ] Enable 2FA via security settings
- [ ] QR code displays correctly
- [ ] Secret key can be copied manually
- [ ] Authenticator app generates matching code
- [ ] Verification succeeds with correct code
- [ ] Verification fails with wrong code
- [ ] Backup codes display (10 codes)
- [ ] User can copy backup codes

### Login
- [ ] Email OTP verification works
- [ ] 2FA step appears after OTP
- [ ] Correct TOTP code allows login
- [ ] Invalid TOTP code shows error
- [ ] Can use backup code instead of TOTP
- [ ] Each backup code can only be used once
- [ ] Dashboard loads after successful 2FA

### Management
- [ ] Disable 2FA with correct password
- [ ] Cannot disable with wrong password
- [ ] Regenerate backup codes works
- [ ] Status shows correct information
- [ ] Backup codes remaining counter accurate

### Edge Cases
- [ ] Time window ±30 seconds works
- [ ] Expired codes are rejected
- [ ] Used backup codes are consumed
- [ ] Can't use same backup code twice
- [ ] Session properly created after 2FA

## 🔧 Code Structure

```
API (Backend)
├── models/User.js (2FA fields)
├── services/twoFactorService.js (TOTP logic)
├── routes/twofa.routes.js (2FA endpoints)
└── routes/auth.routes.js (login with 2FA)

Frontend
├── pages/SecuritySettingsPage.jsx (manage 2FA)
├── pages/LoginPage.jsx (login with 2FA)
├── components/security/
│   ├── TwoFactorSetup.jsx (setup wizard)
│   └── TwoFactorVerification.jsx (verify during login)
└── app/slices/authSlice.js (redux state)
```

## 📚 Documentation Files

- [2FA-GUIDE.md](./2FA-GUIDE.md) - Complete feature documentation
- [API Endpoints](#api-endpoints) - Detailed endpoint documentation

## 🚨 Production Considerations

### Security Checklist
- [ ] Disable console OTP logging in production
- [ ] Implement rate limiting on verification endpoints
- [ ] Hash backup codes in database
- [ ] Add audit logging for 2FA changes
- [ ] Implement session invalidation on 2FA changes
- [ ] Add IP logging for verification attempts
- [ ] Implement device fingerprinting
- [ ] Consider implementing "Remember this device"

### Performance
- [ ] Test with 10k+ users
- [ ] Load test 2FA endpoints
- [ ] Monitor TOTP verification latency
- [ ] Cache 2FA status checks

### Compliance
- [ ] GDPR - Data privacy for 2FA data
- [ ] HIPAA - If applicable
- [ ] SOC 2 - Security requirements
- [ ] ISO 27001 - Information security

## 🎓 Understanding TOTP

### How TOTP Works
1. Shared secret between server and authenticator
2. Current time divided into 30-second windows
3. HMAC-SHA1(secret, time_window) generates 6-digit code
4. Code changes every 30 seconds
5. ±30 second window allows for clock skew

### Algorithm Details
- **Algorithm**: HMAC-SHA1
- **Time Step**: 30 seconds
- **Code Length**: 6 digits
- **Time Window**: ±30 seconds (2 windows)
- **Digits**: 000000-999999

## 📞 Support

For questions or issues:
1. Check troubleshooting section
2. Review detailed documentation
3. Check console logs
4. Test with different authenticator apps
5. Verify system time synchronization

---

**Last Updated**: 2026-06-15
**Version**: 1.0.0
**Status**: Ready for Testing
