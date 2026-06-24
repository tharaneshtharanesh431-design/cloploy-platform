const detectFromNames = (names) => {
  const lower = names.map((item) => item.toLowerCase());
  const has = (needle) => lower.some((item) => item.includes(needle));
  if (has('next.config')) return { framework: 'Next.js', language: 'JavaScript/TypeScript', runtime: 'node:20-alpine' };
  if (has('angular.json')) return { framework: 'Angular', language: 'TypeScript', runtime: 'node:20-alpine' };
  if (has('vite.config') || has('src/main.jsx')) return { framework: 'React', language: 'JavaScript/TypeScript', runtime: 'node:20-alpine' };
  if (has('package.json') && has('server.js')) return { framework: 'Node.js', language: 'JavaScript', runtime: 'node:20-alpine' };
  if (has('pom.xml')) return { framework: 'Spring Boot', language: 'Java', runtime: 'eclipse-temurin:17-jre' };
  if (has('requirements.txt') || has('pyproject.toml')) return { framework: 'Python', language: 'Python', runtime: 'python:3.11-slim' };
  if (has('go.mod')) return { framework: 'Go', language: 'Go', runtime: 'golang:1.22-alpine' };
  return { framework: 'Generic App', language: 'Unknown', runtime: 'node:20-alpine' };
};

export function detectFramework(files = []) {
  const names = files.map((file) => file.originalname || file.filename || file.path || file);
  return detectFromNames(names);
}
