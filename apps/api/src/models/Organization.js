import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'developer', 'viewer'], default: 'developer' }
      }
    ],
    billingPlan: { type: String, default: 'starter' },
    ssoEnabled: { type: Boolean, default: false },
    secrets: [
      {
        key: String,
        value: String,
        scope: { type: String, enum: ['org', 'project'], default: 'org' }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);
