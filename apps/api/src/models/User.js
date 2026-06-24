import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatarUrl: String,
    githubId: String,
    githubUsername: String,
    githubAccessToken: String,
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    usage: {
      monthlyBuilds: { type: Number, default: 0 },
      monthlyDeployments: { type: Number, default: 0 },
      storageGb: { type: Number, default: 0 }
    },
    subscription: {
      status: { type: String, enum: ['free', 'active', 'pending'], default: 'free' },
      plan: { type: String, enum: ['free', 'weekly', 'monthly'], default: 'free' },
      expiresAt: Date,
      paymentReference: String
    },
    otpCode: String,
    otpExpiresAt: Date,
    // 2FA - TOTP Based Authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    twoFactorVerifiedAt: Date,
    onboarded: { type: Boolean, default: false },
    githubCredentials: {
      username: String,
      accessToken: String
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function userPreSave(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
