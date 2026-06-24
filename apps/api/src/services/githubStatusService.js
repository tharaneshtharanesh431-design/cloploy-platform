import axios from 'axios';
import { logger } from '../config/logger.js';

export async function updateCommitStatus({ token, owner, repo, sha, state, description, targetUrl, context }) {
  if (!token) {
    logger.warn(`GITHUB STATUS: Skipped - No GitHub token provided for commit ${sha}`);
    return;
  }
  if (!owner || !repo || !sha) {
    logger.warn(`GITHUB STATUS: Skipped - Missing repository details (owner: ${owner}, repo: ${repo}, sha: ${sha})`);
    return;
  }

  logger.info(`GITHUB STATUS: Setting commit status for ${owner}/${repo}@${sha.slice(0, 7)} to: ${state} (${context})`);

  try {
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`,
      {
        state, // pending, success, failure, error
        target_url: targetUrl || 'http://localhost:3120/deployments',
        description,
        context // e.g. "cloploy/quality-check", "cloploy/build", "cloploy/deploy"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
  } catch (err) {
    logger.error(`GITHUB STATUS error: ${err.response?.data?.message || err.message}`);
  }
}
