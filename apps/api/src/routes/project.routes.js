import { Router } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';
import { detectFramework } from '../services/frameworkDetector.js';
import { generateDockerArtifacts } from '../services/dockerGenerator.js';
import { generateDeploymentPlan } from '../services/deploymentPlanner.js';

const router = Router();
const blockedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mp3', '.wav', '.avi', '.mov'];
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 300 },
  fileFilter: (req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    if (blockedExtensions.some((ext) => lower.endsWith(ext))) {
      return cb(new Error('Images, videos, and audio uploads are rejected for project import'));
    }
    cb(null, true);
  }
});
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await Project.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

const checkProjectLimit = async (req, res, next) => {
  try {
    const count = await Project.countDocuments({ ownerId: req.user._id });
    if (count >= 3 && (!req.user.subscription || req.user.subscription.status !== 'active')) {
      return res.status(403).json({
        limitExceeded: true,
        message: 'Upgrade required. You have reached the limit of 3 free projects. Please subscribe to deploy more projects.'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.post('/', authenticate, checkProjectLimit, [body('name').notEmpty(), body('sourceType').isIn(['github', 'upload'])], validate, async (req, res, next) => {
  try {
    const project = await Project.create({
      ...req.body,
      slug: `${req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`,
      ownerId: req.user._id
    });
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// Helper to recursively list files in directory
function getAllFilesRecursively(dirPath, baseDir = dirPath) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;
  const list = fs.readdirSync(dirPath);
  for (const file of list) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFilesRecursively(filePath, baseDir));
    } else {
      const relative = path.relative(baseDir, filePath);
      results.push(relative.replace(/\\/g, '/')); // Use forward slashes for cross-platform compatibility
    }
  }
  return results;
}

// Session Upload Routes
const sessionsDir = path.resolve(process.cwd(), '../temp_uploads');

// Init Session
router.post('/import/upload/init', authenticate, checkProjectLimit, async (req, res, next) => {
  try {
    const uploadId = uuidv4();
    const sessionDir = path.join(sessionsDir, uploadId);
    fs.mkdirSync(sessionDir, { recursive: true });
    res.json({ uploadId });
  } catch (error) {
    next(error);
  }
});

// Upload chunk of files
router.post('/import/upload/chunk', authenticate, checkProjectLimit, upload.array('files', 100), async (req, res, next) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ message: 'Upload session ID is required.' });
    }

    const safeUploadId = path.basename(uploadId);
    const sessionDir = path.join(sessionsDir, safeUploadId);

    // Validate path and check directory existence
    if (!sessionDir.startsWith(sessionsDir) || !fs.existsSync(sessionDir)) {
      return res.status(400).json({ message: 'Invalid upload session or session has expired.' });
    }

    const paths = JSON.parse(req.body.paths || '[]');
    const files = req.files || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.originalname;
      
      const resolvedPath = path.resolve(sessionDir, relativePath);
      // Path traversal check
      if (!resolvedPath.startsWith(sessionDir)) {
        return res.status(400).json({ message: `Path traversal detected: ${relativePath}` });
      }

      // Ensure directory exists
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      // Write file contents to disk
      fs.writeFileSync(resolvedPath, file.buffer);
    }

    res.json({ success: true, message: `Successfully saved ${files.length} files.` });
  } catch (error) {
    next(error);
  }
});

// Complete Session and trigger framework analysis
router.post('/import/upload/complete', authenticate, checkProjectLimit, async (req, res, next) => {
  const { uploadId, name } = req.body;
  if (!uploadId) {
    return res.status(400).json({ message: 'Upload session ID is required.' });
  }

  const safeUploadId = path.basename(uploadId);
  const sessionDir = path.join(sessionsDir, safeUploadId);

  // Validate session path
  if (!sessionDir.startsWith(sessionsDir) || !fs.existsSync(sessionDir)) {
    return res.status(400).json({ message: 'Invalid or expired upload session.' });
  }

  try {
    // Get all files recursively
    const filePaths = getAllFilesRecursively(sessionDir);
    if (filePaths.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded to the project directory.' });
    }

    const detection = detectFramework(filePaths);
    const dockerArtifacts = generateDockerArtifacts(detection.framework);
    const aiPlan = await generateDeploymentPlan({ project: { name: name || 'Uploaded Project' }, ...detection });

    const project = await Project.create({
      name: name || 'Uploaded Project',
      slug: `${(name || 'uploaded-project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`,
      sourceType: 'upload',
      ownerId: req.user._id,
      framework: detection.framework,
      language: detection.language,
      runtime: detection.runtime,
      autoGeneratedDockerfile: dockerArtifacts.dockerfile,
      aiSummary: aiPlan,
      aiRecommendations: aiPlan.split('\n').slice(0, 5)
    });

    // Cleanup session directory
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error('Failed to cleanup session upload directory:', cleanupErr);
    }

    res.status(201).json({ project, detection, dockerArtifacts, aiPlan });
  } catch (error) {
    // Attempt cleanup on error
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (err) {}
    next(error);
  }
});

router.post('/import/github', authenticate, checkProjectLimit, async (req, res, next) => {
  try {
    const detection = detectFramework([req.body.repositoryUrl || '', req.body.defaultBranch || 'main']);
    const project = await Project.create({
      name: req.body.name,
      slug: `${req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`,
      sourceType: 'github',
      ownerId: req.user._id,
      repositoryUrl: req.body.repositoryUrl,
      defaultBranch: req.body.defaultBranch || 'main',
      framework: detection.framework,
      language: detection.language,
      runtime: detection.runtime
    });
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.get('/by-domain/resolve', async (req, res, next) => {
  try {
    const { host, slug } = req.query;
    let project = null;

    if (host) {
      // 1. Try matching custom domain exactly first
      project = await Project.findOne({ customDomain: host }).populate('latestDeploymentId');
    }

    if (!project && slug) {
      // 2. Try matching by slug
      project = await Project.findOne({ slug }).populate('latestDeploymentId');
    }

    if (!project && host) {
      // 3. Fallback: split host to find possible slug
      const possibleSlug = host.split('.')[0];
      project = await Project.findOne({ slug: possibleSlug }).populate('latestDeploymentId');
    }

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

router.put('/:projectId/domain', authenticate, async (req, res, next) => {
  try {
    const { customDomain } = req.body;
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    project.customDomain = customDomain || null;
    if (customDomain) {
      project.customDomainVerified = true;
      project.customDomainSslActive = true;
    } else {
      project.customDomainVerified = false;
      project.customDomainSslActive = false;
    }
    await project.save();
    res.json({ project, message: 'Custom domain updated and verified successfully!' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.projectId, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, ownerId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ project, message: 'Project updated successfully!' });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user._id }).populate('latestDeploymentId');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

export default router;
