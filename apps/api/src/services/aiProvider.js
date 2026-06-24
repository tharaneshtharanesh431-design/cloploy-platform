import fetch from 'node-fetch';
import { env } from '../config/env.js';

const isRealKey = (key) => Boolean(key && !key.startsWith('YOUR_') && !key.includes('YOUR_REAL_') && key !== 'placeholder');

const PROVIDERS = {
  gemini: {
    isConfigured: () => isRealKey(env.GEMINI_API_KEY),
    label: 'Gemini'
  },
  claude: {
    isConfigured: () => isRealKey(env.CLAUDE_API_KEY),
    label: 'Claude'
  },
  openai: {
    isConfigured: () => isRealKey(env.OPENAI_API_KEY) && Boolean(env.OPENAI_BASE_URL),
    label: 'OpenAI'
  },
  offline: {
    isConfigured: () => true,
    label: 'Offline Helper'
  }
};

const PROVIDER_PRIORITY = ['gemini', 'claude', 'openai'];

function resolveProvider(requested) {
  if (requested && requested !== 'auto') {
    const entry = PROVIDERS[requested];
    if (!entry) {
      throw new Error(`Unknown AI provider "${requested}". Supported: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    if (!entry.isConfigured()) {
      return 'offline';
    }
    return requested;
  }

  for (const name of PROVIDER_PRIORITY) {
    if (PROVIDERS[name].isConfigured()) return name;
  }

  return 'offline';
}

async function callGemini({ systemPrompt, prompt, thread }) {
  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const contents = [];
  if (thread && thread.length > 0) {
    const startIdx = thread[0]?.content?.includes('I am Cloploy AI.') ? 1 : 0;
    for (let i = startIdx; i < thread.length; i++) {
      const msg = thread[i];
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

async function callClaude({ systemPrompt, prompt, thread }) {
  const model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

  const messages = [];
  if (thread && thread.length > 0) {
    const startIdx = thread[0]?.content?.includes('I am Cloploy AI.') ? 1 : 0;
    for (let i = startIdx; i < thread.length; i++) {
      const msg = thread[i];
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response generated';
}

async function callOpenAI({ systemPrompt, prompt, thread }) {
  const messages = [{ role: 'system', content: systemPrompt }];
  if (thread && thread.length > 0) {
    const startIdx = thread[0]?.content?.includes('I am Cloploy AI.') ? 1 : 0;
    for (let i = startIdx; i < thread.length; i++) {
      const msg = thread[i];
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

async function callOfflineFallback({ systemPrompt, prompt, thread }) {
  const p = prompt.toLowerCase();
  
  // Determine query context from thread history
  let context = 'general';
  if (thread && thread.length > 0) {
    const lastBotMsg = [...thread].reverse().find(msg => msg.role === 'assistant');
    if (lastBotMsg) {
      const c = lastBotMsg.content.toLowerCase();
      if (c.includes('domain') || c.includes('dns')) context = 'domain';
      else if (c.includes('build') || c.includes('fail') || c.includes('docker')) context = 'build';
      else if (c.includes('kubernetes') || c.includes('k8s')) context = 'k8s';
      else if (c.includes('billing') || c.includes('price')) context = 'billing';
    }
  }

  const isFollowUp = p.includes('step') || p.includes('explain') || p.includes('why') || p.includes('clarify') || p.includes('more') || p.includes('help');

  if (p.includes('domain') || p.includes('url') || p.includes('dns') || (isFollowUp && context === 'domain')) {
    if (p.includes('3') || p.includes('three')) {
      return `Step 3 in configuring custom domains is adding a CNAME record:
- Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.).
- Go to DNS Settings / DNS Management.
- Add a new record of type: **CNAME**.
- Set Host/Name: \`@\` (or your desired subdomain like \`shop\`).
- Set Value/Points to: \`cname.cloploy.app\`.
- Set TTL to Auto or 3600.
After saving, it may take a few minutes to propagate. Once ready, click **Verify DNS** in Cloploy to activate SSL and route traffic.`;
    }
    return `To configure custom domains in Cloploy:
1. Go to the **Domains** tab in your project page.
2. Enter your custom domain name (e.g. \`shop.mycompany.com\`).
3. Add a CNAME record in your DNS provider pointing to \`cname.cloploy.app\`.
4. Click **Verify DNS** to activate SSL and route traffic.

Note: Wildcard subdomain routing (e.g. \`*.cloploy.app\`) is enabled automatically for all projects!`;
  }
  if (p.includes('fail') || p.includes('build') || p.includes('error') || p.includes('docker') || (isFollowUp && context === 'build')) {
    return `If your container build or deployment failed, check the following:
1. **Dockerfile:** Ensure a valid \`Dockerfile\` exists at your project root or matches your build pack configuration.
2. **Kubernetes logs:** Go to the **Logs** tab of your deployment to view real-time pod logs.
3. **SonarQube Quality Gate:** Check if the SonarQube analysis reported bugs or coverage below the gate threshold.
4. **Environment Variables:** Verify all required variables are set in the **Environment Variables** tab.`;
  }
  if (p.includes('kubernetes') || p.includes('k8s') || p.includes('pod') || p.includes('cluster') || (isFollowUp && context === 'k8s')) {
    return `Cloploy integrates directly with Kubernetes using the official Node client.
- It generates 4 resources automatically: \`Deployment\`, \`Service\` (ClusterIP/NodePort), \`Ingress\` (with custom routing), and \`HPA\` (Horizontal Pod Autoscaler).
- You can monitor the rollout status directly from the **Deployments** panel.`;
  }
  if (p.includes('billing') || p.includes('price') || p.includes('subscription') || p.includes('pro') || (isFollowUp && context === 'billing')) {
    return `Cloploy offers a **Free Starter** plan (up to 3 projects) and **Pro** plans (Weekly Pro for ₹120, Monthly Pro for ₹400).
To upgrade:
1. Go to the **Billing** page.
2. Select your plan.
3. Scan the generated dynamic UPI QR code.
4. Input the 12-digit transaction ID and click **Activate**.`;
  }
  return `Hi there! I am the Cloploy AI DevOps Copilot.
Currently, no external AI provider (Gemini, Claude, or OpenAI) API keys are configured in the \`.env\` file.
To get full AI features, please add:
- \`GEMINI_API_KEY\` (Recommended) or
- \`CLAUDE_API_KEY\` or
- \`OPENAI_API_KEY\` + \`OPENAI_BASE_URL\`
in your root \`.env\` file.

How can I help you with Docker, SonarQube, Jenkins, Kubernetes, or custom domains today?`;
}

const PROVIDER_HANDLERS = {
  gemini: callGemini,
  claude: callClaude,
  openai: callOpenAI,
  offline: callOfflineFallback
};

export async function askAI({ system, prompt, provider = 'auto', thread }) {
  const resolved = resolveProvider(provider);
  const handler = PROVIDER_HANDLERS[resolved];
  return handler({ systemPrompt: system, prompt, thread });
}

export function getConfiguredProviders() {
  return PROVIDER_PRIORITY.filter((name) => PROVIDERS[name].isConfigured()).map((name) => ({
    id: name,
    label: PROVIDERS[name].label,
    configured: true
  }));
}
