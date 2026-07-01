# Cloploy Rebuild and Deploy Script
# This script builds the React frontend, Dockerizes both API and Web components, pushes to ECR,
# updates secrets, and rollout restarts the EKS deployments.

$ErrorActionPreference = "Stop"

Write-Host "=== Starting Cloploy Rebuild & Deployment ===" -ForegroundColor Cyan

# 1. Build React Web App
Write-Host "`n[1/7] Building React frontend..." -ForegroundColor Yellow
npm run build --prefix apps/web

# 2. Authenticate with AWS ECR
Write-Host "`n[2/7] Authenticating with AWS ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 344626518012.dkr.ecr.ap-southeast-2.amazonaws.com

# 3. Build Docker Images
Write-Host "`n[3/7] Building API Docker image..." -ForegroundColor Yellow
docker build -t 344626518012.dkr.ecr.ap-southeast-2.amazonaws.com/cloploy-api:latest -f apps/api/Dockerfile apps/api

Write-Host "`n[4/7] Building Web Docker image..." -ForegroundColor Yellow
docker build -t 344626518012.dkr.ecr.ap-southeast-2.amazonaws.com/cloploy-web:latest -f apps/web/Dockerfile apps/web

# 4. Push Docker Images to ECR
Write-Host "`n[5/7] Pushing API image to ECR..." -ForegroundColor Yellow
docker push 344626518012.dkr.ecr.ap-southeast-2.amazonaws.com/cloploy-api:latest

Write-Host "`n[6/7] Pushing Web image to ECR..." -ForegroundColor Yellow
docker push 344626518012.dkr.ecr.ap-southeast-2.amazonaws.com/cloploy-web:latest

# 5. Sync Kubernetes configuration & secrets
Write-Host "`n[7/7] Syncing Kubernetes Config & Restarting Pods..." -ForegroundColor Yellow

# Create secret from local .env
kubectl create secret generic cloploy-secrets --from-env-file=.env -n cloploy --dry-run=client -o yaml | kubectl apply -f -

# Apply deployment & ingress manifests
kubectl apply -f infra/kubernetes/api-deployment.yaml -n cloploy
kubectl apply -f infra/kubernetes/ingress.yaml -n cloploy

# Restart EKS deployments
kubectl rollout restart deployment cloploy-api -n cloploy
kubectl rollout restart deployment cloploy-web-cloploy-app -n cloploy

# Wait for rollout completion
Write-Host "`nWaiting for deployments to roll out successfully..." -ForegroundColor Gray
kubectl rollout status deployment cloploy-api -n cloploy
kubectl rollout status deployment cloploy-web-cloploy-app -n cloploy

Write-Host "`n=== Deployment Completed Successfully! ===" -ForegroundColor Green
