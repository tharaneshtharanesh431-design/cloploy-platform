import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import { askAI, getConfiguredProviders } from '../services/aiProvider.js';

const router = Router();

router.get('/providers', authenticate, (_req, res) => {
  res.json({ providers: getConfiguredProviders() });
});

router.post('/assistant', authenticate, async (req, res, next) => {
  try {
    const response = await askAI({
      system: 'You are Cloploy AI DevOps Copilot. Focus on deployment automation, cloud architecture, cost, quality, and security.',
      prompt: req.body.message,
      provider: req.body.provider || 'auto',
      thread: req.body.thread
    });
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

router.post('/project-analysis/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const response = await askAI({
      system: 'You are an elite software architect and platform engineer.',
      prompt: `Analyze this project: ${JSON.stringify(project)}. Return sections: architecture, risks, recommended deployment strategy, security, cost optimization.`,
      provider: req.body.provider || 'auto'
    });
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

router.post('/deployment-diagnostics/:deploymentId', authenticate, async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId).populate('projectId');
    const response = await askAI({
      system: 'You are an SRE and DevOps incident responder.',
      prompt: `Review this deployment and provide root cause analysis, fix plan, terraform advice, kubernetes advice, and release notes: ${JSON.stringify(deployment)}`,
      provider: req.body.provider || 'auto'
    });
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

export default router;
