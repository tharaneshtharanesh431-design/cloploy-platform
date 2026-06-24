import axios from 'axios';
import { env } from '../config/env.js';
import { sendEmail } from './emailService.js';

export async function sendDeploymentNotifications({ user, deployment, project }) {
  const summary = `Project ${project.name} deployment ${deployment.version} is now ${deployment.status}`;
  await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: `Cloploy deployment ${deployment.status}`,
      html: `<p>${summary}</p>`
    }),
    env.SLACK_WEBHOOK_URL
      ? axios.post(env.SLACK_WEBHOOK_URL, { text: summary })
      : Promise.resolve({ skipped: true }),
    env.DISCORD_WEBHOOK_URL
      ? axios.post(env.DISCORD_WEBHOOK_URL, { content: summary })
      : Promise.resolve({ skipped: true })
  ]);
}
