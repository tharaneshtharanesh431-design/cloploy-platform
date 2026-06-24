import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
