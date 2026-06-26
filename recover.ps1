# Cloploy EKS Infrastructure Recovery & Application Deployment Automation Script
# Run this script in PowerShell with configured AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "   CLOPLOY EKS INFRASTRUCTURE RECOVERY AUTOMATION  " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

# --------------------------------------------------
# Phase 2: Terraform Backend Recovery (S3 & DynamoDB)
# --------------------------------------------------
Write-Host "`n--- PHASE 2: Backend Recovery ---" -ForegroundColor Cyan

$S3_BUCKET = "cloploy-terraform-state-8124173993"
$DYNAMODB_TABLE = "cloploy-terraform-locks"
$REGION = "ap-southeast-2"

Write-Host "Verifying S3 backend bucket '$S3_BUCKET'..." -ForegroundColor Yellow
aws s3api head-bucket --bucket $S3_BUCKET --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 bucket '$S3_BUCKET' is missing. Creating it..." -ForegroundColor Yellow
    aws s3api create-bucket --bucket $S3_BUCKET --region $REGION --create-bucket-configuration LocationConstraint=$REGION
    Write-Host "S3 bucket created successfully." -ForegroundColor Green
} else {
    Write-Host "S3 bucket exists." -ForegroundColor Green
}

Write-Host "Verifying DynamoDB table '$DYNAMODB_TABLE'..." -ForegroundColor Yellow
aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "DynamoDB table '$DYNAMODB_TABLE' is missing. Creating it..." -ForegroundColor Yellow
    aws dynamodb create-table `
        --table-name $DYNAMODB_TABLE `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $REGION | Out-Null
    
    Write-Host "Waiting for table '$DYNAMODB_TABLE' to become ACTIVE..." -ForegroundColor Yellow
    aws dynamodb wait table-exists --table-name $DYNAMODB_TABLE --region $REGION
    Write-Host "DynamoDB table created and active." -ForegroundColor Green
} else {
    Write-Host "DynamoDB table exists." -ForegroundColor Green
}

# --------------------------------------------------
# Phase 3, 4, 5: Terraform Init, Plan, Apply
# --------------------------------------------------
Write-Host "`n--- PHASE 3, 4, 5: Terraform Lifecycle ---" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfPath = Join-Path $scriptPath "infra/terraform"

Write-Host "Entering Terraform directory: $tfPath" -ForegroundColor Yellow
Push-Location $tfPath

Write-Host "Initializing Terraform backend..." -ForegroundColor Yellow
terraform init -reconfigure
if ($LASTEXITCODE -ne 0) { throw "Terraform Init failed!" }

Write-Host "Validating Terraform code..." -ForegroundColor Yellow
terraform validate
if ($LASTEXITCODE -ne 0) { throw "Terraform Validate failed!" }

Write-Host "Running Terraform Plan..." -ForegroundColor Yellow
terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Plan failed!" }

Write-Host "Applying Terraform Plan..." -ForegroundColor Yellow
terraform apply -auto-approve tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Apply failed!" }

Write-Host "Terraform Apply completed successfully." -ForegroundColor Green
Pop-Location

# --------------------------------------------------
# Phase 6: Kubernetes Connection Setup
# --------------------------------------------------
Write-Host "`n--- PHASE 6: EKS & Kubeconfig ---" -ForegroundColor Cyan

Write-Host "Updating kubeconfig for Cloploy EKS cluster..." -ForegroundColor Yellow
aws eks update-kubeconfig --region $REGION --name cloploy-eks
if ($LASTEXITCODE -ne 0) { throw "Failed to configure kubeconfig!" }

Write-Host "Retrieving EKS Node Group status..." -ForegroundColor Yellow
kubectl get nodes
if ($LASTEXITCODE -ne 0) { throw "EKS nodes not reachable or not ready!" }

Write-Host "Ensuring 'cloploy' namespace exists..." -ForegroundColor Yellow
kubectl create namespace cloploy --dry-run=client -o yaml | kubectl apply -f -

# --------------------------------------------------
# Phase 7: Application Workloads Deployment
# --------------------------------------------------
Write-Host "`n--- PHASE 7: Application Deployment ---" -ForegroundColor Cyan

Write-Host "Applying ConfigMap and Secrets..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/configmap.yaml -n cloploy
kubectl apply -f infra/kubernetes/secret.yaml -n cloploy

Write-Host "Deploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/mongodb.yaml -n cloploy

Write-Host "Deploying Redis..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/redis.yaml -n cloploy

Write-Host "Deploying Backend API Service..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/api-deployment.yaml -n cloploy
kubectl apply -f infra/kubernetes/api-service.yaml -n cloploy

Write-Host "Deploying Frontend Web via Helm (Release cloploy-web)..." -ForegroundColor Yellow
helm upgrade --install cloploy-web ./infra/helm `
    -f ./infra/helm/values.yaml `
    -f ./infra/helm/values-prod.yaml `
    -n cloploy --create-namespace

Write-Host "Deploying RBAC, HPAs, PDBs, and Network Policies..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/rbac.yaml -n cloploy
kubectl apply -f infra/kubernetes/networkpolicy.yaml -n cloploy
kubectl apply -f infra/kubernetes/pdb.yaml -n cloploy
kubectl apply -f infra/kubernetes/hpa.yaml -n cloploy

Write-Host "Polling rollout status for Backend API and Web pods..." -ForegroundColor Yellow
kubectl rollout status deployment/cloploy-api -n cloploy
kubectl rollout status deployment/cloploy-web-cloploy-app -n cloploy

Write-Host "Application deployments rolled out successfully." -ForegroundColor Green

# --------------------------------------------------
# Phase 8: AWS Load Balancer Controller & ALB Ingress
# --------------------------------------------------
Write-Host "`n--- PHASE 8: AWS Load Balancer Controller & ALB Ingress ---" -ForegroundColor Cyan

Write-Host "Deploying AWS Load Balancer Controller..." -ForegroundColor Yellow
helm repo add eks https://aws.github.io/eks-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null

$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
$ALB_ROLE_ARN = "arn:aws:iam::$AWS_ACCOUNT_ID:role/cloploy-eks-alb-ingress-role"

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller `
    -n kube-system `
    --set clusterName=cloploy-eks `
    --set serviceAccount.create=true `
    --set serviceAccount.name=aws-load-balancer-controller `
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$ALB_ROLE_ARN

Write-Host "Applying static ingress configuration..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/ingress.yaml -n cloploy

Write-Host "Waiting for Application Load Balancer DNS mapping..." -ForegroundColor Yellow
$dnsName = ""
$retries = 30
while ($retries -gt 0 -and -not $dnsName) {
    Write-Host "Polling Ingress address status ($retries retries left)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    $dnsName = (kubectl get ingress cloploy-ingress -n cloploy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>$null)
    if (-not $dnsName) {
         $dnsName = (kubectl get ingress cloploy-web-cloploy-app -n cloploy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>$null)
    }
    $retries--
}

if ($dnsName) {
    Write-Host "ALB Ingress DNS Name successfully resolved: $dnsName" -ForegroundColor Green
} else {
    Write-Host "ALB Ingress DNS is taking longer to provision. Retrieve it later via: kubectl get ingress -n cloploy" -ForegroundColor Yellow
}

# --------------------------------------------------
# Phase 10: Final Deployment Verification
# --------------------------------------------------
Write-Host "`n--- PHASE 10: Final Audit Summary ---" -ForegroundColor Cyan

Write-Host "`n[1] EKS Nodes:" -ForegroundColor Magenta
kubectl get nodes

Write-Host "`n[2] All Pods:" -ForegroundColor Magenta
kubectl get pods -A

Write-Host "`n[3] Services:" -ForegroundColor Magenta
kubectl get svc -A

Write-Host "`n[4] Ingress Resources:" -ForegroundColor Magenta
kubectl get ingress -A

Write-Host "`n[5] Terraform Output Variables:" -ForegroundColor Magenta
Push-Location $tfPath
terraform output
Pop-Location

# --------------------------------------------------
# Phase 11: Git Commit and Push
# --------------------------------------------------
Write-Host "`n--- PHASE 11: Git Synchronization ---" -ForegroundColor Cyan
Write-Host "Adding and committing all infrastructure corrections..." -ForegroundColor Yellow
git add .
git commit -m "chore: repair and align infrastructure configuration and ci-cd pipelines"
git push
Write-Host "Git push completed successfully." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "         RECOVERY EXECUTION FINISHED SUCCESSFULLY  " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
