import axios from 'axios';

export async function getGithubRepositories(token) {
  const response = await axios.get('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  return response.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    defaultBranch: repo.default_branch,
    private: repo.private,
    url: repo.html_url,
    cloneUrl: repo.clone_url
  }));
}

export async function createGithubWebhook({ token, owner, repo, webhookUrl }) {
  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      name: 'web',
      active: true,
      events: ['push', 'pull_request'],
      config: { url: webhookUrl, content_type: 'json', insecure_ssl: '0' }
    },
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  return response.data;
}
