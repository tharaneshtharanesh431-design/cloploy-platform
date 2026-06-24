# Cloploy Architecture

## Overview

Cloploy is a multi-tenant SaaS deployment platform composed of a React frontend, Express API, MongoDB control plane, GitHub integration, AI analysis services, Jenkins orchestration, SonarQube quality gates, Terraform-managed AWS infrastructure, EKS-based runtime workloads, and Prometheus/Grafana/ELK observability.

## Core Flow

1. User authenticates with JWT and optional GitHub OAuth.
2. User uploads source files or imports a GitHub repository.
3. Backend detects framework and generates Docker assets.
4. AI engine creates a deployment plan, architecture review, cost/security recommendations.
5. Jenkins pipeline checks out code, builds, tests, runs SonarQube, builds Docker image, pushes to ECR.
6. Terraform provisions or updates AWS resources.
7. Kubernetes manifests deploy workloads into EKS.
8. Prometheus, Grafana, and ELK monitor application runtime.
9. Notifications and AI diagnostics are sent back to the user dashboard.

## Services

- **Frontend (`apps/web`)**: Landing website, auth flows, dashboard, project import, deployment monitoring, AI DevOps Copilot, admin console.
- **API (`apps/api`)**: Authentication, GitHub integration, project management, deployment execution, AI assistant, RBAC, audit-ready endpoints.
- **CI/CD (`infra/jenkins`)**: Automated pipeline with Git checkout, build, test, SonarQube, Docker, ECR, Terraform, Kubernetes, health check stages.
- **Infrastructure (`infra/terraform`)**: VPC, subnets, security groups, IAM, ECR, EKS, S3 backend for Terraform state.
- **Runtime (`infra/kubernetes`)**: Deployment, service, ingress, configmap, secret, HPA with rolling updates and rollback compatibility.
- **Observability (`infra/monitoring`, `infra/logging`)**: Prometheus metrics, Grafana dashboards, Filebeat/Logstash/Elasticsearch/Kibana logging.

## Multi-Tenancy

Each project belongs to a user and can optionally belong to an organization. Tenant-aware separation is modeled at the application layer with project ownership, RBAC, organization membership, and environment scoping. Deployment namespace naming can be extended to per-tenant namespaces on EKS.
