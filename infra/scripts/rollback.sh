#!/usr/bin/env bash
set -euo pipefail
DEPLOYMENT=${1:-cloploy-web}
NAMESPACE=${2:-cloploy}
kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}
kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE}
