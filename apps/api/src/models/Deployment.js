import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'analyzing', 'quality_check', 'building', 'provisioning', 'deploying', 'healthy', 'rolled_back', 'failed'],
      default: 'queued'
    },
    buildLogs: [String],
    qualityGate: {
      passed: { type: Boolean, default: false },
      score: Number,
      issues: [String]
    },
    docker: {
      image: String,
      tag: String,
      ecrRepository: String
    },
    infrastructure: {
      cluster: String,
      namespace: String,
      ingressHost: String,
      terraformWorkspace: String
    },
    monitoring: {
      grafanaDashboardUrl: String,
      prometheusJob: String,
      kibanaUrl: String
    },
    aiDiagnostics: {
      summary: String,
      recommendations: [String],
      rootCause: String,
      costOptimization: [String],
      securityFindings: [String]
    },
    startedAt: Date,
    finishedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Deployment', deploymentSchema);
