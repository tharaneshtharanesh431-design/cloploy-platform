# CLOPLOY

**Tagline:** Upload. Build. Deploy. Scale.

Cloploy is a production-oriented SaaS platform for automated application delivery. It combines project import, AI-assisted deployment planning, code quality gates, Docker image automation, Terraform infrastructure orchestration, Kubernetes deployment, observability, notifications, and rollback workflows.

## Monorepo Layout

- `apps/web` – React + Vite + Tailwind frontend
- `apps/api` – Express + MongoDB backend
- `infra/terraform` – AWS infrastructure as code
- `infra/kubernetes` – Kubernetes manifests/templates
- `infra/jenkins` – CI/CD pipeline
- `infra/monitoring` – Prometheus + Grafana
- `infra/logging` – ELK stack configs
- `docs` – Architecture, database, OpenAPI, setup guides

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

See `docs/installation.md` and `docs/deployment-guide.md` for full setup.
