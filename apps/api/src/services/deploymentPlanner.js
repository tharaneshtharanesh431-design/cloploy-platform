import { askAI } from './aiProvider.js';

export async function generateDeploymentPlan({ project, framework, language }) {
  const system = 'You are Cloploy AI, an elite DevOps architect. Return concise, implementation-ready output.';
  const prompt = `Project: ${project.name}\nFramework: ${framework}\nLanguage: ${language}\nCreate a deployment plan with sections: Build Strategy, Runtime, Infrastructure, Security, Observability, Cost Optimization.`;
  try {
    return await askAI({ system, prompt, provider: 'auto' });
  } catch (err) {
    console.warn(`[AI Planner] Falling back to pre-configured layout: ${err.message}`);
    return `### 🚀 Deployment Plan for ${project.name || 'Uploaded Project'}
**Framework:** ${framework || 'Generic'}
**Language:** ${language || 'Unknown'}

#### 1. Build Strategy
- Build code natively using containerized builds.
- Optimized layer caching is enabled for dependencies.

#### 2. Runtime
- Containerized environment exposing application port.

#### 3. Infrastructure
- Automatically generated Kubernetes deployment manifest.
- Custom EKS load balancer setup.

#### 4. Security
- Encrypted secrets injected at runtime.
- Sealed secret integration for environment variables.

#### 5. Observability
- Prometheus metrics scraping configured.
- Linked to default Cloploy runtime dashboard.

#### 6. Cost Optimization
- Managed resource allocation limits.
- Scale-to-zero active when inactive for over 4 hours.`;
  }
}
