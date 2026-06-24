#!/usr/bin/env bash
set -euo pipefail
PROJECT=${1:-cloploy}
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secret.yaml
kubectl apply -f infra/kubernetes/deployment.yaml
kubectl apply -f infra/kubernetes/service.yaml
kubectl apply -f infra/kubernetes/ingress.yaml
kubectl apply -f infra/kubernetes/hpa.yaml
kubectl rollout status deployment/${PROJECT}-web -n cloploy
