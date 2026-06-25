import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import AuditLog from '../models/AuditLog.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

async function seed() {
  const dbUri = env.MONGODB_URI;
  logger.info(`SEED: Connecting to database at ${dbUri}...`);
  
  mongoose.set('strictQuery', true);
  await mongoose.connect(dbUri);
  logger.info('SEED: Connected successfully.');

  // 1. Clear database
  logger.info('SEED: Dropping existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Deployment.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  logger.info('SEED: Database cleared.');

  // 2. Create admin user
  logger.info('SEED: Seeding default admin user (Tharaneesh)...');
  const adminUser = await User.create({
    name: 'Tharaneesh',
    email: 'tharaneshtharanesh431@gmail.com',
    password: 'SecurePassword123!', // Mongoose hook hashes this
    role: 'admin',
    isEmailVerified: true,
    onboarded: true,
    githubUsername: 'tharaneesh',
    githubCredentials: {
      username: 'tharaneesh',
      accessToken: 'ghp_simulatedTokenForTharaneesh2026'
    },
    subscription: {
      status: 'active',
      plan: 'monthly',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      paymentReference: 'GPAY-REF-99827162'
    },
    usage: {
      monthlyBuilds: 42,
      monthlyDeployments: 38,
      storageGb: 4.2
    }
  });
  logger.info(`SEED: User created successfully. ID: ${adminUser._id}`);

  // 3. Create 3 premium SaaS projects
  logger.info('SEED: Seeding production projects...');
  
  const projectsData = [
    {
      name: 'cloploy-dashboard',
      slug: 'cloploy-dashboard-a1b2c3',
      description: 'Production frontend console displaying deployment statistics, EKS workloads, Loki logs, and billing quotas.',
      ownerId: adminUser._id,
      sourceType: 'github',
      repositoryUrl: 'https://github.com/tharaneesh/cloploy-dashboard',
      defaultBranch: 'main',
      framework: 'React',
      language: 'JavaScript',
      runtime: 'Node.js',
      status: 'deployed',
      deploymentUrl: 'https://cloploy-dashboard.cloploy.app',
      customDomain: 'dashboard.cloploy.com',
      customDomainVerified: true,
      customDomainSslActive: true,
      environmentVariables: [
        { key: 'VITE_API_URL', value: 'https://api.cloploy.com', masked: false },
        { key: 'VITE_WS_URL', value: 'wss://socket.cloploy.com', masked: false },
        { key: 'NODE_ENV', value: 'production', masked: false }
      ],
      aiSummary: 'React.js application with Vite build tool config. Standard single-page application setup optimized for edge delivery (CloudFront CDN). SonarQube quality gate successfully linked.',
      aiRecommendations: [
        'Leverage Route53 latency routing to deploy to nearest global edge caches.',
        'Configure memory limits to 256Mi inside K8s spec files.',
        'Enable gzip and HTTP/2 compression at the Nginx Controller level.'
      ]
    },
    {
      name: 'cloploy-core-api',
      slug: 'cloploy-core-api-d4e5f6',
      description: 'Microservice handling Git webhooks, triggering Jenkins stages, building Docker artifacts, and applying K8s Helm releases.',
      ownerId: adminUser._id,
      sourceType: 'github',
      repositoryUrl: 'https://github.com/tharaneesh/cloploy-core-api',
      defaultBranch: 'main',
      framework: 'Node.js',
      language: 'JavaScript',
      runtime: 'Node.js',
      status: 'deployed',
      deploymentUrl: 'https://cloploy-core-api.cloploy.app',
      customDomain: 'api.cloploy.com',
      customDomainVerified: true,
      customDomainSslActive: true,
      environmentVariables: [
        { key: 'MONGODB_URI', value: 'mongodb+srv://cloploy-db-user:********@cluster0.mongodb.net/cloploy', masked: true },
        { key: 'JWT_SECRET', value: 'change-me-to-a-secure-production-key', masked: true },
        { key: 'REDIS_URL', value: 'redis://redis-cluster.cloploy-system.svc.cluster.local:6379', masked: false }
      ],
      aiSummary: 'Express.js backend with cluster capabilities. Connects to MongoDB Atlas and Redis caching layer. Jenkins webhook endpoint enabled.',
      aiRecommendations: [
        'Ensure database credentials are load from AWS Secrets Manager using IAM Roles for Service Accounts (IRSA).',
        'Enable MongoDB indexing for query performance speed-ups.',
        'Enable rate limiting at the Ingress controller to avoid brute force attacks.'
      ]
    },
    {
      name: 'sonar-scanner-pipeline',
      slug: 'sonar-scanner-pipeline-g7h8i9',
      description: 'Static analysis scheduler orchestrating Jenkins pipelines, SonarQube scans, and code compliance checks.',
      ownerId: adminUser._id,
      sourceType: 'github',
      repositoryUrl: 'https://github.com/tharaneesh/sonar-scanner-pipeline',
      defaultBranch: 'main',
      framework: 'Java Spring Boot',
      language: 'Java',
      runtime: 'Java',
      status: 'deployed',
      deploymentUrl: 'https://sonar-scanner-pipeline.cloploy.app',
      customDomain: 'sonar.cloploy.com',
      customDomainVerified: true,
      customDomainSslActive: true,
      environmentVariables: [
        { key: 'SONAR_HOST_URL', value: 'http://sonarqube.cloploy-system.svc.cluster.local:9000', masked: false },
        { key: 'SPRING_PROFILES_ACTIVE', value: 'prod', masked: false }
      ],
      aiSummary: 'Java Spring Boot application using Maven builder. Pre-configured for JVM container execution. Links with local and remote SonarQube quality gates.',
      aiRecommendations: [
        'Tune JVM heap memory configurations (-Xms512m -Xmx1024m) to fit limits.',
        'Enable Prometheus endpoints (/actuator/prometheus) for metrics aggregation.',
        'Enable security checks to block deployment if code quality gate status is FAILED.'
      ]
    }
  ];

  const seededProjects = [];
  for (const proj of projectsData) {
    const createdProject = await Project.create(proj);
    seededProjects.push(createdProject);
    logger.info(`SEED: Project "${createdProject.name}" created. Slug: ${createdProject.slug}`);
  }

  // 4. Create historic and active deployments for these projects
  logger.info('SEED: Seeding deployment logs and build histories...');
  
  // Dashboard Deployments
  const depDashboard1 = await Deployment.create({
    projectId: seededProjects[0]._id,
    initiatedBy: adminUser._id,
    version: 'rel-2026-06-21T10-15-30Z',
    status: 'healthy',
    buildLogs: [
      'Webhook triggered: Git commit d3b90f1 by tharaneesh',
      'Checking out branch: main',
      'Running npm ci...',
      'Installed 412 packages in 8.4 seconds',
      'Executing npm run build...',
      'Vite compiler: generated static HTML/JS bundle. Size: 1.2MB',
      'Running SonarQube analysis...',
      'SonarQube Gate Passed (Score: 94.2%, 0 Blocker Issues)',
      'Building Docker image local/cloploy-dashboard-a1b2c3:rel-2026-06-21T10-15-30Z',
      'Pushed image to ECR registry',
      'Terraform apply: validation successful. Infrastructure synced.',
      'Syncing ArgoCD application manifest...',
      'ArgoCD sync SUCCESS. Workloads rolled out on EKS namespace: tenant-tharaneesh',
      'Probing health endpoint: https://cloploy-dashboard.cloploy.app/health... OK',
      'Deployment successful!'
    ],
    qualityGate: { passed: true, score: 94, issues: [] },
    docker: {
      image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/cloploy-dashboard-a1b2c3:v1.0.0',
      tag: 'v1.0.0',
      ecrRepository: 'cloploy-dashboard-a1b2c3'
    },
    infrastructure: {
      cluster: 'cloploy-eks',
      namespace: 'tenant-tharaneesh',
      ingressHost: 'cloploy-dashboard.cloploy.app',
      terraformWorkspace: 'cloploy-dashboard-a1b2c3-prod'
    },
    monitoring: {
      grafanaDashboardUrl: 'http://localhost:3001/d/cloploy-runtime',
      prometheusJob: 'cloploy-dashboard-a1b2c3',
      kibanaUrl: 'http://localhost:5601/app/discover'
    },
    aiDiagnostics: {
      summary: 'Dashboard is operating normally. Average API load response times are under 15ms. React components optimized with code-splitting.',
      recommendations: ['Integrate S3 caching policies for assets.', 'Monitor layout loading shifts.'],
      rootCause: '',
      costOptimization: ['Idle pods scales down to 1 during off-peak hours.'],
      securityFindings: ['No credentials exposed.']
    },
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000)
  });

  const depDashboard2 = await Deployment.create({
    projectId: seededProjects[0]._id,
    initiatedBy: adminUser._id,
    version: 'rel-2026-06-22T08-30-00Z',
    status: 'failed',
    buildLogs: [
      'Webhook triggered: Git commit b4a28c3 by tharaneesh',
      'Checking out branch: main',
      'Running npm ci...',
      'Executing npm run build...',
      'Vite build error: [vite:css] Syntax Error: Unexpected token "}" in index.css:124',
      'Build process terminated with exit code 1',
      'Jenkins Pipeline failed at stage: Build',
      'Rolling back cluster deployment to last successful version (rel-2026-06-21T10-15-30Z)'
    ],
    qualityGate: { passed: false, score: 0, issues: ['Vite build syntax error'] },
    docker: {
      image: '',
      tag: '',
      ecrRepository: ''
    },
    infrastructure: {
      cluster: 'cloploy-eks',
      namespace: 'tenant-tharaneesh',
      ingressHost: 'cloploy-dashboard.cloploy.app',
      terraformWorkspace: 'cloploy-dashboard-a1b2c3-prod'
    },
    monitoring: {
      grafanaDashboardUrl: 'http://localhost:3001/d/cloploy-runtime',
      prometheusJob: 'cloploy-dashboard-a1b2c3',
      kibanaUrl: 'http://localhost:5601/app/discover'
    },
    aiDiagnostics: {
      summary: 'Vite compiler encountered a CSS formatting error in index.css line 124, which aborted the build stage before Docker compilation.',
      recommendations: ['Verify index.css file syntax before pushing commits.', 'Enable local pre-commit CSS validation linter.'],
      rootCause: 'Unexpected token "}" inside index.css configuration block.',
      costOptimization: [],
      securityFindings: []
    },
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 12000)
  });

  // Link latest deployment to project
  seededProjects[0].latestDeploymentId = depDashboard1._id;
  await seededProjects[0].save();

  // Core API Deployments
  const depApi1 = await Deployment.create({
    projectId: seededProjects[1]._id,
    initiatedBy: adminUser._id,
    version: 'rel-2026-06-21T12-00-00Z',
    status: 'healthy',
    buildLogs: [
      'Webhook triggered: Git commit f8c187d by tharaneesh',
      'Checking out main branch...',
      'Running npm ci...',
      'Running eslint checker... 0 errors found.',
      'Executing SonarQube quality gate analysis...',
      'SonarQube quality gate: PASSED (91.8%, 0 blocker violations)',
      'Building Docker image local/cloploy-core-api-d4e5f6:rel-2026-06-21T12-00-00Z',
      'Pushing container image to ECR...',
      'Applying Terraform configurations: VPC security rules updated.',
      'Syncing ArgoCD applications...',
      'Deploying API Pods to EKS cluster. Rolling update starting...',
      'Terminating old containers. New containers online.',
      'Health check status: OK. API responding in 8ms.',
      'Release successful!'
    ],
    qualityGate: { passed: true, score: 91, issues: [] },
    docker: {
      image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/cloploy-core-api-d4e5f6:v1.0.0',
      tag: 'v1.0.0',
      ecrRepository: 'cloploy-core-api-d4e5f6'
    },
    infrastructure: {
      cluster: 'cloploy-eks',
      namespace: 'tenant-tharaneesh',
      ingressHost: 'cloploy-core-api.cloploy.app',
      terraformWorkspace: 'cloploy-core-api-d4e5f6-prod'
    },
    monitoring: {
      grafanaDashboardUrl: 'http://localhost:3001/d/cloploy-runtime',
      prometheusJob: 'cloploy-core-api-d4e5f6',
      kibanaUrl: 'http://localhost:5601/app/discover'
    },
    aiDiagnostics: {
      summary: 'Express API is running optimally. CPU utilisation is stable at 18%, and Memory allocation is at 45% of allocated limits.',
      recommendations: ['Configure Redis write replication.', 'Implement request body sanitisation.'],
      rootCause: '',
      costOptimization: ['Using AWS EC2 Spot instances for EKS node groups reduces runtime hosting costs by 70%.'],
      securityFindings: ['MongoDB Atlas URI loaded securely via K8s secrets.']
    },
    startedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 22 * 60 * 60 * 1000 + 55000)
  });

  seededProjects[1].latestDeploymentId = depApi1._id;
  await seededProjects[1].save();

  // Sonar Scanner Deployments
  const depSonar1 = await Deployment.create({
    projectId: seededProjects[2]._id,
    initiatedBy: adminUser._id,
    version: 'rel-2026-06-20T18-40-10Z',
    status: 'healthy',
    buildLogs: [
      'Webhook triggered: Git commit a1239c0 by tharaneesh',
      'Maven project detected. Building via maven compiler...',
      'Executing mvn clean test...',
      'Unit tests: 148 passed, 0 failures.',
      'Running SonarQube analysis...',
      'SonarQube Gate Passed (Score: 88.6%, 1 minor issue)',
      'Compiling Spring Boot jar into Docker container...',
      'Docker push to AWS ECR registry: SUCCESS.',
      'Executing Helm upgrade sonar-scanner-pipeline-release...',
      'Helm deploy success. Workload online on Kubernetes namespace: tenant-tharaneesh',
      'Actuator health check returned UP.',
      'Deployment complete.'
    ],
    qualityGate: { passed: true, score: 88, issues: ['Avoid hardcoded print statement on line 42'] },
    docker: {
      image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/sonar-scanner-pipeline-g7h8i9:v1.0.0',
      tag: 'v1.0.0',
      ecrRepository: 'sonar-scanner-pipeline-g7h8i9'
    },
    infrastructure: {
      cluster: 'cloploy-eks',
      namespace: 'tenant-tharaneesh',
      ingressHost: 'sonar-scanner-pipeline.cloploy.app',
      terraformWorkspace: 'sonar-scanner-pipeline-g7h8i9-prod'
    },
    monitoring: {
      grafanaDashboardUrl: 'http://localhost:3001/d/cloploy-runtime',
      prometheusJob: 'sonar-scanner-pipeline-g7h8i9',
      kibanaUrl: 'http://localhost:5601/app/discover'
    },
    aiDiagnostics: {
      summary: 'Java Spring Boot service deployed successfully. Embedded Tomcat listening on port 8080.',
      recommendations: ['Optimize JVM heap settings.', 'Track minor sonar quality warnings.'],
      rootCause: '',
      costOptimization: [],
      securityFindings: []
    },
    startedAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 40 * 60 * 60 * 1000 + 78000)
  });

  seededProjects[2].latestDeploymentId = depSonar1._id;
  await seededProjects[2].save();

  // 5. Seed Audit Logs
  logger.info('SEED: Seeding audit trails...');
  await AuditLog.create([
    { actorId: adminUser._id, action: 'user.login', entityType: 'User', entityId: adminUser._id, metadata: { method: 'google' } },
    { actorId: adminUser._id, action: 'user.onboard', entityType: 'User', entityId: adminUser._id, metadata: { githubUsername: 'tharaneesh' } },
    { actorId: adminUser._id, action: 'project.create', entityType: 'Project', entityId: seededProjects[0]._id, metadata: { name: seededProjects[0].name } },
    { actorId: adminUser._id, action: 'project.create', entityType: 'Project', entityId: seededProjects[1]._id, metadata: { name: seededProjects[1].name } },
    { actorId: adminUser._id, action: 'project.create', entityType: 'Project', entityId: seededProjects[2]._id, metadata: { name: seededProjects[2].name } },
    { actorId: adminUser._id, action: 'domain.verify', entityType: 'Project', entityId: seededProjects[0]._id, metadata: { host: seededProjects[0].customDomain } },
    { actorId: adminUser._id, action: 'domain.verify', entityType: 'Project', entityId: seededProjects[1]._id, metadata: { host: seededProjects[1].customDomain } },
    { actorId: adminUser._id, action: 'domain.verify', entityType: 'Project', entityId: seededProjects[2]._id, metadata: { host: seededProjects[2].customDomain } },
    { actorId: adminUser._id, action: 'deployment.success', entityType: 'Deployment', entityId: depDashboard1._id, metadata: { version: depDashboard1.version } },
    { actorId: adminUser._id, action: 'deployment.failed', entityType: 'Deployment', entityId: depDashboard2._id, metadata: { version: depDashboard2.version } },
    { actorId: adminUser._id, action: 'deployment.success', entityType: 'Deployment', entityId: depApi1._id, metadata: { version: depApi1.version } },
    { actorId: adminUser._id, action: 'deployment.success', entityType: 'Deployment', entityId: depSonar1._id, metadata: { version: depSonar1.version } }
  ]);

  logger.info('SEED: Seeding complete! Database is populated with premium production-ready details.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error(`SEED: Failed during execution: ${err.message}`);
  process.exit(1);
});
