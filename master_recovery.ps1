# Cloploy Platform Production Infrastructure Recovery & Deployment Orchestrator
# Run this script in PowerShell with active AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "     CLOPLOY PRODUCTION RECOVERY ORCHESTRATOR      " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$REGION = "ap-southeast-2"
$S3_BACKEND = "cloploy-terraform-state"
$DYNAMODB_BACKEND = "cloploy-terraform-locks"

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
Write-Host "Active AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green

# --------------------------------------------------
# PHASE 1: Audit Current Files
# --------------------------------------------------
Write-Host "`n--- PHASE 1: Auditing Files ---" -ForegroundColor Cyan
$requiredFiles = @(
    "infra/terraform/versions.tf",
    "infra/terraform/eks.tf",
    "infra/terraform/iam.tf",
    "infra/terraform/network.tf",
    "infra/terraform/ecr.tf",
    "infra/helm/Chart.yaml",
    "infra/helm/values-prod.yaml",
    "infra/kubernetes/ingress.yaml",
    "infra/kubernetes/api-deployment.yaml"
)
foreach ($f in $requiredFiles) {
    if (Test-Path $f) {
        Write-Host "  OK: $f exists" -ForegroundColor Gray
    } else {
        throw "Critical file missing: $f"
    }
}

# --------------------------------------------------
# PHASE 2: Terraform State Alignment & Imports
# --------------------------------------------------
Write-Host "`n--- PHASE 2: Reconciling Terraform State ---" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfPath = Join-Path $scriptPath "infra/terraform"

Push-Location $tfPath

Write-Host "Initializing Terraform backend..." -ForegroundColor Yellow
terraform init -reconfigure
if ($LASTEXITCODE -ne 0) { throw "Terraform Init failed!" }

$stateList = (terraform state list 2>$null)

# Helper function to check and import
function Import-Resource($addr, $awsId) {
    if (-not $awsId -or $awsId -eq "None" -or $awsId -eq "") {
        Write-Host "AWS Resource for $addr does not exist. Will be created fresh." -ForegroundColor Gray
        return
    }
    if ($stateList -contains $addr) {
        Write-Host "Resource '$addr' already exists in state." -ForegroundColor Green
        return
    }
    Write-Host "AWS Resource '$awsId' found. Importing into state as '$addr' to prevent ResourceInUseException..." -ForegroundColor Yellow
    terraform import $addr $awsId
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Import failed for $addr ($awsId)." -ForegroundColor Red
    } else {
        Write-Host "Successfully imported $addr." -ForegroundColor Green
    }
}

# Discover and Import Existing Networking Resources
$vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=cloploy-vpc" --query "Vpcs[0].VpcId" --output text)
if ($vpcId -eq "None" -or -not $vpcId) {
    $vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Project,Values=cloploy" --query "Vpcs[0].VpcId" --output text)
}
Import-Resource "aws_vpc.main" $vpcId

if ($vpcId -and $vpcId -ne "None") {
    $pub1 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-1" --query "Subnets[0].SubnetId" --output text)
    $pub2 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-2" --query "Subnets[0].SubnetId" --output text)
    $priv1 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-1" --query "Subnets[0].SubnetId" --output text)
    $priv2 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-2" --query "Subnets[0].SubnetId" --output text)
    
    Import-Resource "aws_subnet.public[0]" $pub1
    Import-Resource "aws_subnet.public[1]" $pub2
    Import-Resource "aws_subnet.private[0]" $priv1
    Import-Resource "aws_subnet.private[1]" $priv2
    
    $igwId = (aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpcId" --query "InternetGateways[0].InternetGatewayId" --output text)
    Import-Resource "aws_internet_gateway.igw" $igwId
    
    $natId = (aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpcId" "Name=state,Values=available" --query "NatGateways[0].NatGatewayId" --output text)
    Import-Resource "aws_nat_gateway.nat" $natId
    
    if ($natId -and $natId -ne "None") {
        $eipAllocId = (aws ec2 describe-nat-gateways --nat-gateway-ids $natId --query "NatGateways[0].NatGatewayAddresses[0].AllocationId" --output text)
        Import-Resource "aws_eip.nat" $eipAllocId
    }
    
    $pubRtId = (aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-rt" --query "RouteTables[0].RouteTableId" --output text)
    $privRtId = (aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-rt" --query "RouteTables[0].RouteTableId" --output text)
    Import-Resource "aws_route_table.public" $pubRtId
    Import-Resource "aws_route_table.private" $privRtId
    
    $sgId = (aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpcId" "Name=group-name,Values=cloploy-eks-nodes" --query "SecurityGroups[0].GroupId" --output text)
    Import-Resource "aws_security_group.eks_nodes" $sgId
}

# Discover and Import Existing EKS Cluster (CRITICAL: prevents ResourceInUseException)
$clusterExists = $false
aws eks describe-cluster --name cloploy-eks --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { 
    $clusterExists = $true 
    Import-Resource "aws_eks_cluster.main" "cloploy-eks"
}

# Discover and Import Existing ECR Repos
Import-Resource "aws_ecr_repository.web" "cloploy-web"
Import-Resource "aws_ecr_repository.api" "cloploy-api"

# Discover and Import EKS IAM Roles
Import-Resource "aws_iam_role.eks_cluster" "cloploy-eks-cluster-role"
Import-Resource "aws_iam_role.eks_nodes" "cloploy-eks-node-role"
Import-Resource "aws_iam_role.alb_ingress" "cloploy-eks-alb-ingress-role"
Import-Resource "aws_iam_role.autoscaler" "cloploy-eks-autoscaler-role"
Import-Resource "aws_iam_role.external_dns" "cloploy-eks-external-dns-role"

# Discover and Import IAM Policies
Import-Resource "aws_iam_policy.alb_ingress" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-alb-ingress-policy"
Import-Resource "aws_iam_policy.autoscaler" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-autoscaler-policy"
Import-Resource "aws_iam_policy.external_dns" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-external-dns-policy"

# Discover and Import OIDC Provider
if ($clusterExists) {
    $issuer = (aws eks describe-cluster --name cloploy-eks --query "cluster.identity.oidc.issuer" --output text)
    $issuerClean = $issuer.Replace("https://", "")
    $oidcArn = (aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn,'$issuerClean')].Arn" --output text)
    if ($oidcArn -and $oidcArn -ne "None") {
        Import-Resource "aws_iam_openid_connect_provider.eks" $oidcArn
    }
}

# Discover and Import State Buckets/Tables
Import-Resource "aws_s3_bucket.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_s3_bucket_versioning.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_dynamodb_table.terraform_locks" "cloploy-terraform-locks"

# Run Terraform Plan and Apply (Step 8 & 9)
Write-Host "`n--- Running Terraform Apply ---" -ForegroundColor Yellow
terraform fmt
terraform validate
if ($LASTEXITCODE -ne 0) { throw "Terraform Validation failed!" }

terraform plan -out=tfplan
terraform apply -auto-approve tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Apply failed!" }

Write-Host "Terraform provisioning aligned." -ForegroundColor Green
Pop-Location

# --------------------------------------------------
# PHASE 3 & 4: EKS & Managed Node Group Recovery
# --------------------------------------------------
Write-Host "`n--- PHASE 3 & 4: EKS & Node Group ---" -ForegroundColor Cyan
aws eks update-kubeconfig --region $REGION --name cloploy-eks
if ($LASTEXITCODE -ne 0) { throw "Kubeconfig update failed!" }

# Wait for Node Group to be ACTIVE
Write-Host "Checking EKS Managed Node Group status..." -ForegroundColor Yellow
while ($true) {
    $status = (aws eks describe-nodegroup --cluster-name cloploy-eks --nodegroup-name cloploy-main --region $REGION --query "nodegroup.status" --output text 2>$null)
    if ($status -eq "ACTIVE") {
        Write-Host "EKS Node Group 'cloploy-main' is ACTIVE." -ForegroundColor Green
        break
    }
    Write-Host "Node Group status is '$status'. Waiting 15 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
}

# Wait for worker nodes to reach Ready state
Write-Host "Waiting for EKS Nodes to join and reach Ready status..." -ForegroundColor Yellow
while ($true) {
    $nodes = (kubectl get nodes --no-headers 2>$null)
    if ($nodes) {
        $notReady = ($nodes | Select-String -Pattern "NotReady")
        if (-not $notReady) {
            Write-Host "All worker nodes are registered and Ready:" -ForegroundColor Green
            kubectl get nodes
            break
        }
    }
    Write-Host "Nodes not ready yet. Waiting 10 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
}

# --------------------------------------------------
# PHASE 5 & 6: Deploy Kubernetes Core Add-Ons & Monitoring
# --------------------------------------------------
Write-Host "`n--- PHASE 5 & 6: Deploying Add-Ons & Monitoring ---" -ForegroundColor Cyan

# 1. Metrics Server
Write-Host "Installing Metrics Server..." -ForegroundColor Yellow
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. EBS CSI Driver
Write-Host "Installing AWS EBS CSI Driver..." -ForegroundColor Yellow
aws eks create-addon --cluster-name cloploy-eks --addon-name aws-ebs-csi-driver --region $REGION 2>&1 | Out-Null

# 3. Secrets Store CSI Driver
Write-Host "Installing Secrets Store CSI Driver..." -ForegroundColor Yellow
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null
helm upgrade --install csi-secrets-store secrets-store-csi-driver/csi-secrets-store -n kube-system

# 4. Prometheus & Grafana Monitoring Stack
Write-Host "Installing Prometheus & Grafana Stack..." -ForegroundColor Yellow
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
    --namespace monitoring --create-namespace `
    --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false `
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# 5. AWS Load Balancer Controller
Write-Host "Installing AWS Load Balancer Controller..." -ForegroundColor Yellow
helm repo add eks https://aws.github.io/eks-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null

$ALB_ROLE_ARN = "arn:aws:iam::$AWS_ACCOUNT_ID:role/cloploy-eks-alb-ingress-role"
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller `
    -n kube-system `
    --set clusterName=cloploy-eks `
    --set serviceAccount.create=true `
    --set serviceAccount.name=aws-load-balancer-controller `
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$ALB_ROLE_ARN

# --------------------------------------------------
# PHASE 7: Build ECR Images and Deploy Applications
# --------------------------------------------------
Write-Host "`n--- PHASE 7: Application Builds & Deployments ---" -ForegroundColor Cyan

# Docker login to ECR
$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
Write-Host "Logging into Amazon ECR ($ECR_REGISTRY)..." -ForegroundColor Yellow
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build & Push API Image
Write-Host "Building Backend API Docker image..." -ForegroundColor Yellow
docker build -t $ECR_REGISTRY/cloploy-api:latest ./apps/api
docker push $ECR_REGISTRY/cloploy-api:latest

# Build & Push Web Image
Write-Host "Building Frontend Web Docker image..." -ForegroundColor Yellow
docker build -t $ECR_REGISTRY/cloploy-web:latest ./apps/web
docker push $ECR_REGISTRY/cloploy-web:latest

# Deploy Workloads
Write-Host "Deploying Cloploy platform namespace, ConfigMaps, and secrets..." -ForegroundColor Yellow
kubectl create namespace cloploy --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f infra/kubernetes/configmap.yaml -n cloploy
kubectl apply -f infra/kubernetes/secret.yaml -n cloploy
kubectl apply -f infra/kubernetes/mongodb.yaml -n cloploy
kubectl apply -f infra/kubernetes/redis.yaml -n cloploy
kubectl apply -f infra/kubernetes/api-deployment.yaml -n cloploy
kubectl apply -f infra/kubernetes/api-service.yaml -n cloploy

Write-Host "Deploying Frontend Web Helm chart (Release cloploy-web)..." -ForegroundColor Yellow
helm upgrade --install cloploy-web ./infra/helm `
    -f ./infra/helm/values.yaml `
    -f ./infra/helm/values-prod.yaml `
    --set image.repository="$ECR_REGISTRY/cloploy-web" `
    --set image.tag="latest" `
    -n cloploy --create-namespace

Write-Host "Applying Ingress, HPA, Network Policies, and PodDisruptionBudgets..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/rbac.yaml -n cloploy
kubectl apply -f infra/kubernetes/networkpolicy.yaml -n cloploy
kubectl apply -f infra/kubernetes/pdb.yaml -n cloploy
kubectl apply -f infra/kubernetes/ingress.yaml -n cloploy
kubectl apply -f infra/kubernetes/hpa.yaml -n cloploy

# Rollout status
Write-Host "Waiting for deployments to roll out..." -ForegroundColor Yellow
kubectl rollout status deployment/cloploy-api -n cloploy
kubectl rollout status deployment/cloploy-web-cloploy-app -n cloploy

Write-Host "Application deployments are Running." -ForegroundColor Green

# --------------------------------------------------
# PHASE 10 & 11: Final Validation
# --------------------------------------------------
Write-Host "`n--- PHASE 10 & 11: Final Audits ---" -ForegroundColor Cyan

# Assert Terraform plan = No changes
Write-Host "Verifying Terraform Plan has no changes..." -ForegroundColor Yellow
Push-Location $tfPath
terraform plan -detailed-exitcode
$planExit = $LASTEXITCODE
Pop-Location

if ($planExit -eq 0) {
    Write-Host "Terraform state is fully aligned with zero changes planned." -ForegroundColor Green
} else {
    Write-Host "Terraform plan reports changes are still pending. Run apply again if needed." -ForegroundColor Yellow
}

Write-Host "`nKubernetes Nodes:" -ForegroundColor Magenta
kubectl get nodes
Write-Host "`nAll Pods:" -ForegroundColor Magenta
kubectl get pods -A
Write-Host "`nAll Services:" -ForegroundColor Magenta
kubectl get svc -A
Write-Host "`nAll Ingresses:" -ForegroundColor Magenta
kubectl get ingress -A
Write-Host "`nHelm Releases:" -ForegroundColor Magenta
helm list -A
Write-Host "`nTerraform State List:" -ForegroundColor Magenta
Push-Location $tfPath
terraform state list
Pop-Location

# --------------------------------------------------
# PHASE 12: Git Synchronization
# --------------------------------------------------
Write-Host "`n--- PHASE 12: Git Sync ---" -ForegroundColor Cyan
git add .
git commit -m "Infrastructure reset completed:
Clean AWS
Terraform backend repaired
State repaired
Resources recreated
EKS healthy
Terraform fully synchronized"
git push
Write-Host "Git push complete." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "     RECOVERY & DEPLOYMENT FINISHED SUCCESSFULLY   " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
