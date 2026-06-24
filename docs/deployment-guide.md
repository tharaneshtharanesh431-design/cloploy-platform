# Deployment Guide

## CI/CD Setup
1. Create Jenkins credentials for AWS, ECR, and SonarQube.
2. Configure `SONAR_HOST_URL` in Jenkins global environment.
3. Create the `cloploy-pipeline` job using `infra/jenkins/Jenkinsfile`.

## AWS Bootstrapping
1. Create an S3 bucket with versioning enabled for the Terraform backend.
2. Apply Terraform files in `infra/terraform`.
3. Update kubeconfig for the new EKS cluster.

## Kubernetes
Apply manifests:

```bash
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secret.yaml
kubectl apply -f infra/kubernetes/deployment.yaml
kubectl apply -f infra/kubernetes/service.yaml
kubectl apply -f infra/kubernetes/ingress.yaml
kubectl apply -f infra/kubernetes/hpa.yaml
```

## Observability
- Prometheus config: `infra/monitoring/prometheus.yml`
- Grafana dashboard: `infra/monitoring/grafana-dashboard.json`
- ELK pipeline: `infra/logging/logstash.conf`

## Rollback

```bash
./infra/scripts/rollback.sh cloploy-web cloploy
```
