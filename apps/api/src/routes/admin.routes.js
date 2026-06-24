import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import AuditLog from '../models/AuditLog.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/overview', async (req, res, next) => {
  try {
    const [users, projects, deployments, auditLogs] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Deployment.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(20)
    ]);
    res.json({ users, projects, deployments, auditLogs });
  } catch (error) {
    next(error);
  }
});

export default router;
