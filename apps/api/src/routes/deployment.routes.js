import { Router } from 'express';
import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';
import { runAutomatedDeployment } from '../services/deploymentEngine.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const deployments = await Deployment.find().populate('projectId').sort({ createdAt: -1 }).limit(50);
    res.json({ deployments });
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/run', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const deployment = await runAutomatedDeployment({ project, user: req.user, io: req.app.get('io') });
    res.status(201).json({ deployment });
  } catch (error) {
    next(error);
  }
});

router.post('/:deploymentId/rollback', authenticate, async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId);
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });
    deployment.status = 'rolled_back';
    deployment.buildLogs.push('Rollback triggered via Cloploy');
    await deployment.save();
    req.app.get('io')?.to(`project:${deployment.projectId}`).emit('deployment:update', deployment);
    res.json({ deployment, message: 'Rollback triggered' });
  } catch (error) {
    next(error);
  }
});

export default router;
