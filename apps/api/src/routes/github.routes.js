import { Router } from 'express';
import passport from 'passport';
import { authenticate } from '../middleware/auth.js';
import { signAccessToken } from '../services/tokenService.js';
import { getGithubRepositories, createGithubWebhook } from '../services/githubService.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { runAutomatedDeployment } from '../services/deploymentEngine.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const router = Router();

router.get('/connect', passport.authenticate('github', { session: false }));

router.get('/callback', passport.authenticate('github', { session: false, failureRedirect: `${env.CLIENT_URL}/login` }), async (req, res) => {
  const token = signAccessToken(req.user);
  res.redirect(`${env.CLIENT_URL}/auth/github-success?token=${token}`);
});

router.get('/repositories', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.githubAccessToken) return res.status(400).json({ message: 'GitHub not connected' });
    const repositories = await getGithubRepositories(user.githubAccessToken);
    res.json({ repositories });
  } catch (error) {
    next(error);
  }
});

router.post('/webhooks', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const webhook = await createGithubWebhook({ token: user.githubAccessToken, ...req.body });
    res.status(201).json({ webhook });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const { ref, repository } = req.body;
    logger.info(`GITHUB WEBHOOK: Received push event for ${repository?.full_name} on ref ${ref}`);
    if (!ref || !repository) {
      return res.status(200).send('Webhook received, but missing repo metadata.');
    }
    
    const project = await Project.findOne({ repositoryUrl: repository.html_url });
    if (!project) {
      logger.warn(`GITHUB WEBHOOK: No project found matching repository URL: ${repository.html_url}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const defaultBranchRef = `refs/heads/${project.defaultBranch || 'main'}`;
    if (ref !== defaultBranchRef) {
      return res.status(200).send(`Ignored push event on branch ${ref}. Default branch is ${project.defaultBranch}`);
    }
    
    logger.info(`GITHUB WEBHOOK: Triggering automated deployment for project ${project.name}`);
    const user = await User.findById(project.ownerId);
    if (!user) {
      return res.status(404).json({ message: 'Owner user not found' });
    }
    
    const io = req.app.get('io');
    runAutomatedDeployment({ project, user, io }).catch(err => {
      logger.error(`GITHUB WEBHOOK: Automated deployment failed: ${err.message}`);
    });
    
    res.status(202).json({ message: 'Automated deployment triggered' });
  } catch (error) {
    next(error);
  }
});

export default router;
