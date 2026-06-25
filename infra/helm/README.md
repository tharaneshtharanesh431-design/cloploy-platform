# Cloploy Application Helm Chart

This Helm chart handles the deployment of the Cloploy platform to Kubernetes, supporting multiple target environments (Development, QA, and Production).

## Environments

We support environment configuration overrides using specific values files:

- **Development**: `values-dev.yaml` (Single replica, minimal resources, scaled-down ingress config)
- **QA**: `values-qa.yaml` (Dual replicas, scaling enabled, moderate resource limits)
- **Production**: `values-prod.yaml` (Three initial replicas, Auto Scaling enabled up to 10 instances, high availability resource allocation, ALB ingress rules)

## Install or Upgrade

To install/upgrade the chart in the `cloploy` namespace, run:

```bash
# Development
helm upgrade --install cloploy-web ./infra/helm -f ./infra/helm/values.yaml -f ./infra/helm/values-dev.yaml -n cloploy --create-namespace

# QA
helm upgrade --install cloploy-web ./infra/helm -f ./infra/helm/values.yaml -f ./infra/helm/values-qa.yaml -n cloploy --create-namespace

# Production
helm upgrade --install cloploy-web ./infra/helm -f ./infra/helm/values.yaml -f ./infra/helm/values-prod.yaml -n cloploy --create-namespace
```

## Configurable Values

Refer to [values.yaml](values.yaml) for a comprehensive list of default variables, probe mappings, and resource allocations.
